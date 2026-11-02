"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  formatReceiptMoney,
  formatReceiptMoneyPlain,
  type ReceiptPayload,
} from "@/lib/receipt-api";

/** "DarkGold Gym" -> "DG"; used when the gym has not uploaded a logo. */
function monogram(name: string): string {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "DG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const STATUS_TONE: Record<ReceiptPayload["status"], string> = {
  "FULLY PAID": "border-[#1f7a4d]/30 bg-[#1f7a4d]/10 text-[#16603c]",
  "PARTIAL PAYMENT": "border-[#a86a12]/30 bg-[#a86a12]/10 text-[#7c4e0b]",
  "PAYMENT RECEIVED": "border-[#8a6a1f]/30 bg-[#8a6a1f]/10 text-[#6b510f]",
};

function QrBlock({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!value) {
      setDataUrl(null);
      return () => {
        active = false;
      };
    }
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 260,
      color: { dark: "#121212", light: "#fcf8ee" },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  if (!dataUrl) {
    return (
      <div className="flex size-[84px] items-center justify-center rounded-md border border-[#d8cbaa] bg-[#f5eeda] text-[8px] font-medium uppercase tracking-[0.12em] text-[#8b7c58]">
        QR
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Scan to open the receipt PDF"
      width={84}
      height={84}
      className="size-[84px] rounded-md border border-[#d8cbaa] bg-white p-1"
    />
  );
}

type ReceiptPreviewProps = {
  receipt: ReceiptPayload;
  /** Extra classes for the scroll/scale wrapper. */
  className?: string;
  /** Disable the paper shadow when embedded in a dense settings preview. */
  flat?: boolean;
  /** Marks this sheet as the print target (only one may exist at a time). */
  printable?: boolean;
  /** Scale / size adjustment */
  scale?: "compact" | "standard" | "large";
  /** Optional custom title, e.g. "Official Fee Receipt" */
  customTitle?: string;
  /** Optional custom category text, e.g. "Membership payment" */
  customCategory?: string;
};

/**
 * The on-screen receipt. It deliberately uses fixed cream/black/gold colours
 * instead of theme tokens: a receipt should look the same in light and dark
 * mode, and the same as the PDF the member downloads.
 */
export function ReceiptPreview({
  receipt,
  className,
  flat,
  printable = false,
  scale = "standard",
  customTitle,
  customCategory,
}: ReceiptPreviewProps) {
  const [activeScale, setActiveScale] = useState(scale);

  useEffect(() => {
    setActiveScale(scale);
  }, [scale]);

  const hasDiscount = receipt.fees.discountPaise > 0;
  const hasPrior = receipt.fees.priorPaidPaise > 0;
  const hasBalance = receipt.fees.balancePaise > 0;
  const contactLine = useMemo(
    () =>
      [receipt.gym.phone, receipt.gym.email, receipt.gym.website]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    [receipt.gym.phone, receipt.gym.email, receipt.gym.website],
  );

  const scaleClasses = {
    compact: "max-w-[620px] text-[90%]",
    standard: "max-w-[760px] text-[100%]",
    large: "max-w-[860px] text-[110%]",
  }[activeScale];

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <article
        id={printable ? "receipt-print-root" : undefined}
        aria-label={`Payment receipt ${receipt.receiptNumber}`}
        className={cn(
          "receipt-sheet mx-auto w-full min-w-[540px] overflow-hidden bg-[#fcf8ee] text-[#1b1a17] transition-all",
          scaleClasses,
          flat ? "rounded-lg" : "rounded-xl shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]",
        )}
      >
        {/* Black masthead */}
        <header className="relative overflow-hidden bg-[#0b0b0c] px-7 py-6 text-[#f8f3e6] sm:px-9 sm:py-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 size-56 rounded-full bg-[#e8b84d]/10 blur-2xl"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-3.5">
              {receipt.gym.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receipt.gym.logoDataUrl}
                  alt={`${receipt.gym.gymName} logo`}
                  className="size-14 shrink-0 rounded-lg border border-[#e8b84d]/35 bg-white/95 object-contain p-1"
                />
              ) : (
                <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-lg border border-[#e8b84d]/40 bg-[#e8b84d]/12 font-serif text-lg font-bold tracking-wide text-[#f2cf7a]">
                  {monogram(receipt.gym.gymName)}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-serif text-[24px] leading-tight font-semibold tracking-tight text-[#f6d477]">
                  {receipt.gym.gymName}
                </h2>
                <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9b789]">
                  {receipt.gym.tagline}
                </p>
              </div>
            </div>

            <div className="max-w-[250px] text-right text-[10.5px] leading-relaxed text-[#cfc6b4]">
              {receipt.gym.address && <p className="whitespace-pre-line">{receipt.gym.address}</p>}
              {contactLine.length > 0 && (
                <p className="mt-1 text-[#a99f8b]">{contactLine.join("  ·  ")}</p>
              )}
            </div>
          </div>
        </header>

        {/* Gold rule */}
        <div
          aria-hidden
          className="h-[3px] w-full bg-[linear-gradient(90deg,#8a6414_0%,#e8b84d_28%,#ffe4a0_50%,#e8b84d_72%,#8a6414_100%)]"
        />

        <div className="px-7 pb-7 pt-6 sm:px-9">
          {/* Title + receipt metadata */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] text-[#977327]">
                {customCategory || "Membership payment"}
              </p>
              <h3 className="mt-1 font-serif text-[28px] leading-none font-semibold tracking-tight text-[#171512]">
                {customTitle || "Payment Receipt"}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8b7c58]">
                Receipt No.
              </p>
              <p className="mt-0.5 font-mono text-[14px] font-bold tracking-wide text-[#171512]">
                {receipt.receiptNumber}
              </p>
              <span
                className={cn(
                  "mt-1.5 inline-flex rounded-full border px-2.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[0.14em]",
                  STATUS_TONE[receipt.status],
                )}
              >
                {receipt.status}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-[#d9cba6] pb-4 text-[10px] text-[#6f644d]">
            <span>
              <span className="font-semibold uppercase tracking-[0.12em] text-[#8b7c58]">
                Date
              </span>{" "}
              {receipt.payment.dateLabel} · {receipt.payment.timeLabel}
            </span>
            <span>
              <span className="font-semibold uppercase tracking-[0.12em] text-[#8b7c58]">
                Mode
              </span>{" "}
              {receipt.payment.modeLabel}
            </span>
            {receipt.payment.reference && (
              <span className="min-w-0 truncate">
                <span className="font-semibold uppercase tracking-[0.12em] text-[#8b7c58]">
                  Ref
                </span>{" "}
                {receipt.payment.reference}
              </span>
            )}
          </div>

          {/* Member + membership */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <section className="rounded-lg border border-[#ddd0ad] bg-[#f7f1e0] px-4 py-3.5">
              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#977327]">
                Received from
              </p>
              <p className="mt-1.5 text-[15px] font-semibold leading-tight text-[#171512]">
                {receipt.member.name}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-[#6f644d]">
                {receipt.member.code}
                {receipt.member.phone ? ` · ${receipt.member.phone}` : ""}
              </p>
              {receipt.member.email && (
                <p className="mt-0.5 truncate text-[10px] text-[#6f644d]">{receipt.member.email}</p>
              )}
            </section>

            <section className="rounded-lg border border-[#ddd0ad] bg-[#f7f1e0] px-4 py-3.5">
              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#977327]">
                Membership
              </p>
              <p className="mt-1.5 text-[13.5px] font-semibold leading-tight text-[#171512]">
                {receipt.plan.name}
              </p>
              <p className="mt-0.5 text-[10px] text-[#6f644d]">
                {receipt.plan.durationLabel}
              </p>
              <p className="mt-1 text-[10px] text-[#6f644d]">
                <span className="font-semibold text-[#4c4433]">Valid</span>{" "}
                {receipt.membership.startDateLabel} — {receipt.membership.endDateLabel}
              </p>
            </section>
          </div>

          {/* Fee table */}
          <table className="mt-5 w-full border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-[#171512] text-[#f6d477]">
                <th className="px-3 py-2 text-left text-[8.5px] font-bold uppercase tracking-[0.16em]">
                  Description
                </th>
                <th className="w-28 px-3 py-2 text-right text-[8.5px] font-bold uppercase tracking-[0.16em]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#e2d6b8]">
                <td className="px-3 py-2.5 text-[#2a271f]">{receipt.fees.description}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[#2a271f]">
                  {formatReceiptMoney(receipt.fees.subtotalPaise)}
                </td>
              </tr>
              {hasDiscount && (
                <tr className="border-b border-[#e2d6b8]">
                  <td className="px-3 py-2 text-[#4e6b3a]">Discount</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#4e6b3a]">
                    − {formatReceiptMoney(receipt.fees.discountPaise)}
                  </td>
                </tr>
              )}
              <tr className="border-b border-[#d9cba6] bg-[#f7f1e0]">
                <td className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#4c4433]">
                  Total membership fee
                </td>
                <td className="px-3 py-2.5 text-right text-[13px] font-bold tabular-nums text-[#171512]">
                  {formatReceiptMoney(receipt.fees.totalPaise)}
                </td>
              </tr>
              {hasPrior && (
                <tr className="border-b border-[#e2d6b8]">
                  <td className="px-3 py-2 text-[#6f644d]">Previously paid</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#6f644d]">
                    {formatReceiptMoney(receipt.fees.priorPaidPaise)}
                  </td>
                </tr>
              )}
              <tr className="border-b border-[#e2d6b8]">
                <td className="px-3 py-2 text-[#6f644d]">Total paid to date</td>
                <td className="px-3 py-2 text-right tabular-nums text-[#6f644d]">
                  {formatReceiptMoney(receipt.fees.paidPaise)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b7c58]">
                  {hasBalance ? "Outstanding balance" : "Balance"}
                </td>
                <td
                  className={cn(
                    "px-3 py-3 text-right text-[15px] font-bold tabular-nums",
                    hasBalance ? "text-[#a05c0a]" : "text-[#16603c]",
                  )}
                >
                  {formatReceiptMoney(receipt.fees.balancePaise)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount received highlight */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#c9a64b] bg-[linear-gradient(135deg,#f9efd2_0%,#f3e3b7_100%)] px-4 py-3">
            <div>
              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#8b6a1c]">
                Amount received with this receipt
              </p>
              <p className="mt-0.5 text-[10px] text-[#6f644d]">
                {receipt.payment.modeLabel} · {receipt.payment.dateLabel}
              </p>
            </div>
            <p className="text-[22px] font-bold leading-none tabular-nums text-[#6b510f]">
              {formatReceiptMoney(receipt.payment.amountPaise)}
            </p>
          </div>

          {/* Footer: QR + signature */}
          <div className="mt-5 flex items-end justify-between gap-5 border-t border-[#d9cba6] pt-4">
            <div className="flex items-start gap-3">
              {receipt.gym.qrEnabled && receipt.links.pdf ? (
                <>
                  <QrBlock value={receipt.links.pdf} />
                  <div className="max-w-[180px] pt-1">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-[#8b7c58]">
                      Scan to verify
                    </p>
                    <p className="mt-1 text-[9.5px] leading-relaxed text-[#6f644d]">
                      Opens the secure PDF receipt. Links expire automatically.
                    </p>
                  </div>
                </>
              ) : (
                <p className="max-w-[220px] text-[9.5px] leading-relaxed text-[#6f644d]">
                  This receipt is generated from the gym&apos;s payment record and is valid
                  without a signature.
                </p>
              )}
            </div>

            <div className="min-w-[150px] text-center">
              {receipt.gym.signatureDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receipt.gym.signatureDataUrl}
                  alt="Authorised signature"
                  className="mx-auto h-11 max-w-[170px] object-contain"
                />
              ) : (
                <div className="mx-auto h-11" aria-hidden />
              )}
              <div className="mt-1 border-t border-[#8b7c58]/60 pt-1.5">
                <p className="text-[9.5px] font-semibold text-[#2a271f]">
                  {receipt.gym.authorizedSignatory}
                </p>
                <p className="text-[8px] uppercase tracking-[0.16em] text-[#8b7c58]">
                  Authorised signatory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thank-you band */}
        <footer className="bg-[#0b0b0c] px-7 py-4 text-center sm:px-9">
          <p className="text-[10.5px] leading-relaxed text-[#d8cfbd]">{receipt.footerMessage}</p>
          <p className="mt-1.5 text-[8px] font-medium uppercase tracking-[0.2em] text-[#8f846c]">
            {receipt.gym.gymName} · Computer-generated receipt · Amounts in INR
            {receipt.fees.totalPaise > 0
              ? ` · ${formatReceiptMoneyPlain(receipt.fees.totalPaise)} total`
              : ""}
          </p>
        </footer>
      </article>
    </div>
  );
}
