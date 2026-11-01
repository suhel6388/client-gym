"use client";

import {
  ImagePlus,
  Info,
  Loader2,
  QrCode,
  ReceiptText,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  fetchReceiptSettings,
  saveReceiptSettings,
  type ReceiptPayload,
  type ReceiptSettingsPayload,
} from "@/lib/receipt-api";
import { useToast } from "../providers/ToastProvider";
import { DashboardCard } from "../DashboardCard";
import { ReceiptPreview } from "./ReceiptPreview";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";

/* ------------------------------------------------------------------------- */
/* Form state                                                               */
/* ------------------------------------------------------------------------- */

type ReceiptForm = {
  gymName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  footerMessage: string;
  authorizedSignatory: string;
  receiptPrefix: string;
  qrEnabled: boolean;
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
};

const EMPTY_FORM: ReceiptForm = {
  gymName: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  footerMessage: "",
  authorizedSignatory: "",
  receiptPrefix: "RCPT",
  qrEnabled: true,
  logoDataUrl: null,
  signatureDataUrl: null,
};

function formFromPayload(payload: ReceiptSettingsPayload): ReceiptForm {
  const { gym, settings, branding } = payload;
  return {
    gymName: settings.gymName ?? gym.name ?? "",
    tagline: settings.tagline ?? branding.tagline ?? "",
    address: settings.address ?? gym.address ?? branding.address ?? "",
    phone: settings.phone ?? gym.phone ?? branding.phone ?? "",
    email: settings.email ?? gym.email ?? branding.email ?? "",
    website: settings.website ?? branding.website ?? "",
    footerMessage: settings.footerMessage ?? branding.footerMessage ?? "",
    authorizedSignatory:
      settings.authorizedSignatory ?? branding.authorizedSignatory ?? "",
    receiptPrefix: settings.receiptPrefix || branding.receiptPrefix || "RCPT",
    qrEnabled: settings.qrEnabled !== false,
    logoDataUrl: settings.logoDataUrl ?? branding.logoDataUrl ?? null,
    signatureDataUrl:
      settings.signatureDataUrl ?? branding.signatureDataUrl ?? null,
  };
}

/* ------------------------------------------------------------------------- */
/* Images                                                                   */
/* ------------------------------------------------------------------------- */

const MAX_DATA_URL_LENGTH = 2_700_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    image.src = url;
  });
}

/**
 * Downscales an upload on the client so the settings row stays small and the
 * server's 2 MB image guard is never hit by a phone photo.
 */
async function imageToDataUrl(
  file: File,
  {
    maxWidth,
    maxHeight,
    background = "transparent",
  }: { maxWidth: number; maxHeight: number; background?: string },
): Promise<string> {
  if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
    throw new Error("Upload a PNG or JPEG image.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("That image is larger than 12 MB. Choose a smaller file.");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not process the image.");
  if (background !== "transparent") {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);

  // PNG keeps logo/signature transparency. Fall back to JPEG for very large
  // photographic logos that would otherwise exceed the row limit.
  let dataUrl = canvas.toDataURL("image/png");
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    const jpegCanvas = document.createElement("canvas");
    jpegCanvas.width = width;
    jpegCanvas.height = height;
    const jpegContext = jpegCanvas.getContext("2d");
    if (!jpegContext) throw new Error("This browser could not process the image.");
    jpegContext.fillStyle = "#ffffff";
    jpegContext.fillRect(0, 0, width, height);
    jpegContext.drawImage(image, 0, 0, width, height);
    dataUrl = jpegCanvas.toDataURL("image/jpeg", 0.86);
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error("That image is still too large after resizing. Try a smaller file.");
  }
  return dataUrl;
}

/* ------------------------------------------------------------------------- */
/* Sample receipt for the live preview                                      */
/* ------------------------------------------------------------------------- */

const SAMPLE_LINK = "https://darkgoldgym.example.com/api/v1/receipts/public/sample/pdf";
const DEFAULT_FOOTER =
  "Thank you for choosing {gymName}! Your support keeps our community strong. Stay Fit, Stay Strong!";

function renderFooter(template: string, gymName: string): string {
  const source = template.trim() || DEFAULT_FOOTER;
  return source
    .replace(/\{\{?\s*(gym[_\s]?name)\s*\}?\}/gi, gymName)
    .replace(/\{\{?\s*(member[_\s]?name)\s*\}?\}/gi, "Priya Sharma");
}

function buildSampleReceipt(
  form: ReceiptForm,
  fallback: ReceiptSettingsPayload["defaults"] | null,
): ReceiptPayload {
  const prefix = (form.receiptPrefix || "RCPT")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 12) || "RCPT";
  const subtotalPaise = 450000;
  const discountPaise = 50000;
  const totalPaise = subtotalPaise - discountPaise;
  const paidPaise = 250000;
  const balancePaise = totalPaise - paidPaise;

  return {
    version: 1,
    id: null,
    receiptNumber: `${prefix}-0042`,
    issuedAt: new Date().toISOString(),
    status: "PARTIAL PAYMENT",
    member: {
      id: null,
      code: "MEM-0102",
      name: "Priya Sharma",
      phone: "+91 98765 43210",
      email: "priya@example.com",
    },
    gym: {
      gymName: form.gymName.trim() || "Your Gym",
      tagline: form.tagline.trim() || fallback?.tagline || "Premium Fitness Club",
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      logoDataUrl: form.logoDataUrl,
      signatureDataUrl: form.signatureDataUrl,
      authorizedSignatory: form.authorizedSignatory.trim() || "Authorised Signatory",
      qrEnabled: form.qrEnabled,
    },
    plan: {
      name: "Gold Monthly",
      durationMonths: 1,
      durationLabel: "1 month",
      description: "Full gym access",
    },
    membership: {
      id: null,
      startDate: null,
      endDate: null,
      startDateLabel: "01 Nov 2026",
      endDateLabel: "30 Nov 2026",
    },
    fees: {
      description: "Gold Monthly membership fee (1 month)",
      subtotalPaise,
      discountPaise,
      totalPaise,
      paidPaise,
      priorPaidPaise: paidPaise - 150000,
      balancePaise,
    },
    payment: {
      amountPaise: 150000,
      mode: "UPI",
      modeLabel: "UPI",
      date: new Date().toISOString(),
      dateKey: new Date().toISOString().slice(0, 10),
      dateLabel: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      timeLabel: "10:42 am",
      reference: "UPI-8842199",
      status: "SUCCESS",
    },
    footerMessage: renderFooter(
      form.footerMessage || fallback?.footerMessage || DEFAULT_FOOTER,
      form.gymName.trim() || "Your Gym",
    ),
    links: { pdf: SAMPLE_LINK, expiresAt: null },
    whatsapp: { phone: null, message: "" },
  };
}

/* ------------------------------------------------------------------------- */
/* Component                                                                */
/* ------------------------------------------------------------------------- */

export function ReceiptSettingsCard() {
  const toast = useToast();
  const [payload, setPayload] = useState<ReceiptSettingsPayload | null>(null);
  const [form, setForm] = useState<ReceiptForm>(EMPTY_FORM);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "signature" | null>(null);

  const logoInput = useRef<HTMLInputElement>(null);
  const signatureInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setLoadError(null);
    try {
      const data = await fetchReceiptSettings();
      setPayload(data);
      setForm(formFromPayload(data));
      setStatus("ready");
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Couldn't load receipt settings.",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof ReceiptForm>(key: K, value: ReceiptForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const preview = useMemo(
    () => buildSampleReceipt(form, payload?.defaults ?? null),
    [form, payload?.defaults],
  );

  const handleUpload = useCallback(
    async (kind: "logo" | "signature", file: File | undefined) => {
      if (!file) return;
      setUploading(kind);
      try {
        const dataUrl = await imageToDataUrl(file, {
          maxWidth: kind === "logo" ? 640 : 720,
          maxHeight: kind === "logo" ? 640 : 280,
        });
        update(kind === "logo" ? "logoDataUrl" : "signatureDataUrl", dataUrl);
        toast.success(
          kind === "logo" ? "Logo added" : "Signature added",
          "Save the settings to use it on new receipts.",
        );
      } catch (error) {
        toast.error(
          "Couldn't use that image",
          error instanceof Error ? error.message : "Choose a PNG or JPEG image.",
        );
      } finally {
        setUploading(null);
        if (kind === "logo" && logoInput.current) logoInput.current.value = "";
        if (kind === "signature" && signatureInput.current) {
          signatureInput.current.value = "";
        }
      }
    },
    [toast],
  );

  const handleSave = useCallback(async () => {
    if (form.gymName.trim().length === 0) {
      toast.error("Gym name is required", "Members need to see which gym issued the receipt.");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Check the email", "Enter a valid receipt contact email.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveReceiptSettings({
        gymName: form.gymName.trim() || null,
        tagline: form.tagline.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        footerMessage: form.footerMessage.trim() || null,
        authorizedSignatory: form.authorizedSignatory.trim() || null,
        receiptPrefix: form.receiptPrefix.trim() || undefined,
        qrEnabled: form.qrEnabled,
        logoDataUrl: form.logoDataUrl,
        signatureDataUrl: form.signatureDataUrl,
      });
      setPayload(saved);
      setForm(formFromPayload(saved));
      toast.success(
        "Receipt settings saved",
        "New receipts will use this branding immediately.",
      );
    } catch (error) {
      toast.error(
        "Couldn't save settings",
        error instanceof ApiError ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }, [form, toast]);

  const fillFromGym = useCallback(() => {
    if (!payload) return;
    setForm((current) => ({
      ...current,
      gymName: payload.gym.name ?? current.gymName,
      address: payload.gym.address ?? current.address,
      phone: payload.gym.phone ?? current.phone,
      email: payload.gym.email ?? current.email,
    }));
  }, [payload]);

  if (status === "loading") {
    return (
      <DashboardCard
        title="Receipt branding"
        subtitle="Logo, contact details and the footer printed on every receipt"
        icon={ReceiptText}
      >
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-card-hover/50" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (status === "error") {
    return (
      <DashboardCard
        title="Receipt branding"
        subtitle="Logo, contact details and the footer printed on every receipt"
        icon={ReceiptText}
      >
        <div className="mt-5 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {loadError ?? "Couldn't load receipt settings."}
        </div>
        <div className="mt-3">
          <Button variant="secondary" size="md" onClick={load}>
            <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
            Retry
          </Button>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Receipt branding"
      subtitle="Logo, contact details and the footer printed on every receipt"
      icon={ReceiptText}
      delay={20}
    >
      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Form */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label>Gym logo</Label>
              <span className="text-[11px] text-faint">PNG or JPEG · transparent PNG works best</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-[#0b0b0c]">
                {form.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoDataUrl}
                    alt="Current gym logo"
                    className="size-full object-contain p-1"
                  />
                ) : (
                  <ImagePlus className="size-5 text-gold/70" strokeWidth={1.75} aria-hidden />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(event) => handleUpload("logo", event.target.files?.[0])}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => logoInput.current?.click()}
                  disabled={uploading !== null}
                >
                  {uploading === "logo" ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden />
                  ) : (
                    <Upload className="size-3.5" strokeWidth={1.75} aria-hidden />
                  )}
                  Upload logo
                </Button>
                {form.logoDataUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => update("logoDataUrl", null)}
                    disabled={uploading !== null}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
              Gym details
            </p>
            <button
              type="button"
              onClick={fillFromGym}
              className="text-[11px] font-medium text-gold transition-colors hover:text-gold-bright"
            >
              Use gym profile details
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="receipt-gym-name">Gym name</Label>
              <Input
                id="receipt-gym-name"
                className="mt-1.5"
                value={form.gymName}
                onChange={(event) => update("gymName", event.target.value)}
                maxLength={120}
                placeholder="DarkGold Gym"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="receipt-tagline">Tagline</Label>
              <Input
                id="receipt-tagline"
                className="mt-1.5"
                value={form.tagline}
                onChange={(event) => update("tagline", event.target.value)}
                maxLength={120}
                placeholder="Premium Fitness Club"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="receipt-address">Address</Label>
              <Textarea
                id="receipt-address"
                className="mt-1.5 min-h-[72px] resize-y"
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Street, area, city, PIN"
              />
            </div>
            <div>
              <Label htmlFor="receipt-phone">Phone</Label>
              <Input
                id="receipt-phone"
                className="mt-1.5"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                maxLength={30}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label htmlFor="receipt-email">Email</Label>
              <Input
                id="receipt-email"
                type="email"
                className="mt-1.5"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                maxLength={191}
                placeholder="hello@gym.com"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="receipt-website">Website</Label>
              <Input
                id="receipt-website"
                className="mt-1.5"
                value={form.website}
                onChange={(event) => update("website", event.target.value)}
                maxLength={191}
                placeholder="www.darkgoldgym.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="receipt-prefix">Receipt prefix</Label>
              <Input
                id="receipt-prefix"
                className="mt-1.5 font-mono uppercase"
                value={form.receiptPrefix}
                onChange={(event) =>
                  update(
                    "receiptPrefix",
                    event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                  )
                }
                maxLength={12}
                placeholder="RCPT"
              />
              <p className="mt-1.5 text-[11px] text-faint">
                Numbers look like <span className="font-mono text-subtle">{form.receiptPrefix || "RCPT"}-0042</span>.
              </p>
            </div>
            <div>
              <Label htmlFor="receipt-signatory">Authorised signatory</Label>
              <Input
                id="receipt-signatory"
                className="mt-1.5"
                value={form.authorizedSignatory}
                onChange={(event) => update("authorizedSignatory", event.target.value)}
                maxLength={120}
                placeholder="Owner name / Manager"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <Label>Signature image</Label>
              <span className="text-[11px] text-faint">Optional · printed above the signatory name</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-14 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-white/95">
                {form.signatureDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.signatureDataUrl}
                    alt="Current signature"
                    className="size-full object-contain p-1"
                  />
                ) : (
                  <ImagePlus className="size-4 text-[#8b7c58]" strokeWidth={1.75} aria-hidden />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={signatureInput}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(event) => handleUpload("signature", event.target.files?.[0])}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => signatureInput.current?.click()}
                  disabled={uploading !== null}
                >
                  {uploading === "signature" ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden />
                  ) : (
                    <Upload className="size-3.5" strokeWidth={1.75} aria-hidden />
                  )}
                  Upload signature
                </Button>
                {form.signatureDataUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => update("signatureDataUrl", null)}
                    disabled={uploading !== null}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="receipt-footer">Footer / thank-you message</Label>
            <Textarea
              id="receipt-footer"
              className="mt-1.5 min-h-[92px] resize-y leading-relaxed"
              value={form.footerMessage}
              onChange={(event) => update("footerMessage", event.target.value)}
              maxLength={600}
              rows={3}
              placeholder={payload?.defaults.footerMessage ?? DEFAULT_FOOTER}
            />
            <p className="mt-1.5 text-[11px] text-faint">
              Use <span className="font-mono text-subtle">{"{gymName}"}</span> and{" "}
              <span className="font-mono text-subtle">{"{memberName}"}</span> to personalise
              this line.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-card-hover/25 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
                <QrCode className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">QR code on receipts</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
                  Members scan it to open the secure PDF. The link expires automatically.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.qrEnabled}
              aria-label="Show QR code on receipts"
              onClick={() => update("qrEnabled", !form.qrEnabled)}
              className={
                form.qrEnabled
                  ? "relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-gold transition-colors"
                  : "relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-line-strong transition-colors"
              }
            >
              <span
                className={
                  form.qrEnabled
                    ? "inline-block size-5 translate-x-[22px] rounded-full bg-white shadow transition-transform"
                    : "inline-block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform"
                }
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-4">
            <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
              ) : (
                <Save className="size-4" strokeWidth={2} aria-hidden />
              )}
              {saving ? "Saving…" : "Save receipt settings"}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={load}
              disabled={saving || uploading !== null}
            >
              <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
              Discard changes
            </Button>
            <span className="text-[11px] text-faint">Preview updates as you type.</span>
          </div>

          <p className="flex items-start gap-2 rounded-lg border border-line/60 bg-card-hover/30 px-3.5 py-3 text-[11px] leading-relaxed text-faint">
            <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span>
              These details are stored for this gym only. Existing receipts keep the branding
              snapshot they were issued with; new receipts use the latest settings.
            </span>
          </p>
        </div>

        {/* Live preview */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Live preview
            </p>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
              Sample data
            </span>
          </div>
          <div className="rounded-xl border border-line/60 bg-canvas/60 p-2.5">
            <ReceiptPreview receipt={preview} flat className="max-h-[720px]" />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
