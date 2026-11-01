/**
 * Payment receipt + receipt-branding API.
 *
 * The receipt is created by the backend inside the same transaction as the
 * payment. This module keeps every receipt call in one place so the preview,
 * PDF download, WhatsApp share and Settings card all agree on the payload.
 *
 * `POST /payments` still returns `{ data: <payment> }`, but it also adds
 * top-level `receipt`, `whatsapp`, `duplicate` and `receiptError` fields, so it
 * is requested with `unwrap: false`.
 */

import { isAxiosError } from "axios";
import {
  apiClient,
  ApiError,
  apiRequest,
  type PaymentModeDto,
} from "./api";

/* ------------------------------------------------------------------------- */
/* Types                                                                     */
/* ------------------------------------------------------------------------- */

export type ReceiptImageDataUrl = string | null;

export type ReceiptPayload = {
  version: number;
  id: string | null;
  receiptNumber: string;
  issuedAt: string;
  status: "FULLY PAID" | "PARTIAL PAYMENT" | "PAYMENT RECEIVED";
  member: {
    id: string | null;
    code: string;
    name: string;
    phone: string;
    email: string;
  };
  gym: {
    gymName: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoDataUrl: ReceiptImageDataUrl;
    signatureDataUrl: ReceiptImageDataUrl;
    authorizedSignatory: string;
    qrEnabled: boolean;
  };
  plan: {
    name: string;
    durationMonths: number;
    durationLabel: string;
    description: string;
  };
  membership: {
    id: string | null;
    startDate: string | null;
    endDate: string | null;
    startDateLabel: string;
    endDateLabel: string;
  };
  fees: {
    description: string;
    subtotalPaise: number;
    discountPaise: number;
    totalPaise: number;
    paidPaise: number;
    priorPaidPaise: number;
    balancePaise: number;
  };
  payment: {
    amountPaise: number;
    mode: PaymentModeDto;
    modeLabel: string;
    date: string;
    dateKey: string;
    dateLabel: string;
    timeLabel: string;
    reference: string;
    status: string;
  };
  footerMessage: string;
  links: {
    pdf: string;
    expiresAt: string | null;
  };
  whatsapp: {
    phone: string | null;
    message: string;
  };
};

export type ReceiptWhatsAppBundle = {
  phone: string | null;
  /** `https://wa.me/...` — null when the member has no usable number. */
  url: string | null;
  message: string;
  cloudAvailable: boolean;
};

export type PaymentReceiptRecord = {
  id: string;
  receiptNumber?: string;
  memberId?: string;
  amount?: number;
  [key: string]: unknown;
};

/** Raw `POST /payments` response (envelope preserved). */
export type PaymentReceiptResponse = {
  data: PaymentReceiptRecord;
  duplicate?: boolean;
  receipt: ReceiptPayload | null;
  whatsapp: ReceiptWhatsAppBundle | null;
  receiptError?: string | null;
};

export type CreateReceiptPaymentInput = {
  memberId: string;
  membershipId?: string | null;
  /** Amount in paise (minor units). */
  amount: number;
  paymentMode: PaymentModeDto;
  reference?: string | null;
  paymentDate?: string;
  status?: string;
  idempotencyKey?: string;
};

export type ReceiptSettingsFields = {
  gymName: string | null;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  footerMessage: string | null;
  authorizedSignatory: string | null;
  signatureDataUrl: ReceiptImageDataUrl;
  logoDataUrl: ReceiptImageDataUrl;
  qrEnabled: boolean;
  receiptPrefix: string;
};

export type ReceiptSettingsPayload = {
  gym: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  settings: ReceiptSettingsFields;
  branding: {
    gymName: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    footerMessage: string;
    authorizedSignatory: string;
    signatureDataUrl: ReceiptImageDataUrl;
    logoDataUrl: ReceiptImageDataUrl;
    qrEnabled: boolean;
    receiptPrefix: string;
  };
  defaults: {
    tagline: string;
    footerMessage: string;
    receiptPrefix: string;
    paymentModes: Record<string, string>;
  };
};

export type ReceiptSettingsInput = Partial<
  Omit<ReceiptSettingsFields, "qrEnabled" | "receiptPrefix">
> & {
  qrEnabled?: boolean;
  receiptPrefix?: string;
};

/* ------------------------------------------------------------------------- */
/* Idempotency                                                               */
/* ------------------------------------------------------------------------- */

/**
 * A submission key that survives a retry of the same form submit. It is not a
 * secret; the server scopes it to the authenticated gym.
 */
export function newReceiptIdempotencyKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `rcpt-${random}`;
}

/* ------------------------------------------------------------------------- */
/* Payment + receipt                                                         */
/* ------------------------------------------------------------------------- */

/**
 * Records a membership payment and returns the payment plus its receipt.
 *
 * The `Idempotency-Key` header makes a retried submit (double click, timeout,
 * network retry) return the original payment instead of charging twice.
 */
export function createPaymentWithReceipt(
  input: CreateReceiptPaymentInput,
): Promise<PaymentReceiptResponse> {
  const idempotencyKey = input.idempotencyKey || newReceiptIdempotencyKey();
  const body: CreateReceiptPaymentInput = { ...input };
  delete body.idempotencyKey;

  return apiRequest<PaymentReceiptResponse>("/payments", {
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
    unwrap: false,
  });
}

/** GET /payments/:id/receipt — authenticated JSON payload. */
export function fetchPaymentReceipt(
  paymentId: string,
  signal?: AbortSignal,
): Promise<ReceiptPayload> {
  return apiRequest<ReceiptPayload>(
    `/payments/${encodeURIComponent(paymentId)}/receipt`,
    { signal },
  );
}

async function blobOrThrow(
  path: string,
  options: { signal?: AbortSignal } = {},
): Promise<Blob> {
  try {
    const response = await apiClient.request<Blob>({
      url: path,
      method: "GET",
      responseType: "blob",
      signal: options.signal,
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      let message = "Couldn't download the receipt PDF.";
      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text()) as {
            error?: string;
            message?: string;
          };
          message = parsed.error || parsed.message || message;
        } catch {
          // Keep the generic message for a non-JSON error body.
        }
      }
      throw new ApiError(message, status, {
        code: status === 404 ? "RECEIPT_NOT_FOUND" : undefined,
      });
    }
    throw new ApiError("Couldn't download the receipt PDF.", 0);
  }
}

/** GET /payments/:id/receipt/pdf — authenticated PDF blob. */
export function fetchPaymentReceiptPdf(
  paymentId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return blobOrThrow(
    `/payments/${encodeURIComponent(paymentId)}/receipt/pdf`,
    { signal },
  );
}

/** POST /payments/:id/receipt/whatsapp — optional WhatsApp Cloud API send. */
export function sendReceiptViaWhatsAppCloud(paymentId: string) {
  return apiRequest<{
    sent: boolean;
    provider: string;
    messageId?: string;
    phone: string | null;
    cloudAvailable: boolean;
  }>(`/payments/${encodeURIComponent(paymentId)}/receipt/whatsapp`, {
    method: "POST",
    body: {},
  });
}

/* ------------------------------------------------------------------------- */
/* Receipt branding settings                                                 */
/* ------------------------------------------------------------------------- */

/** GET /receipt-settings — scoped to the signed-in gym on the server. */
export function fetchReceiptSettings(
  signal?: AbortSignal,
): Promise<ReceiptSettingsPayload> {
  return apiRequest<ReceiptSettingsPayload>("/receipt-settings", { signal });
}

/** PUT /receipt-settings — upserts the one settings row for this gym. */
export function saveReceiptSettings(
  input: ReceiptSettingsInput,
): Promise<ReceiptSettingsPayload> {
  return apiRequest<ReceiptSettingsPayload>("/receipt-settings", {
    method: "PUT",
    body: input,
  });
}

/* ------------------------------------------------------------------------- */
/* Formatting helpers                                                        */
/* ------------------------------------------------------------------------- */

export function formatReceiptMoney(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Math.max(0, Math.round(Number(paise) || 0)) / 100);
}

export function formatReceiptMoneyPlain(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, Math.round(Number(paise) || 0)) / 100);
}
