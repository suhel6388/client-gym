"use client";

import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MessageCircle,
  Printer,
  Share2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  fetchPaymentReceiptPdf,
  sendReceiptViaWhatsAppCloud,
  type ReceiptPayload,
  type ReceiptWhatsAppBundle,
} from "@/lib/receipt-api";
import {
  copyText,
  downloadBlob,
  openExternal,
  preferredWhatsAppUrl,
  printReceipt,
  receiptFileName,
} from "@/lib/receipt-share";
import { cn } from "@/lib/cn";
import { useToast } from "../providers/ToastProvider";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { ReceiptPreview } from "./ReceiptPreview";

type ReceiptModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptPayload | null;
  whatsapp?: ReceiptWhatsAppBundle | null;
  /** Non-fatal message, e.g. the payment saved but the receipt snapshot failed. */
  notice?: string | null;
  /** Show the "just paid" success banner. */
  celebrate?: boolean;
};

type BusyAction = "pdf" | "whatsapp" | "copy" | "cloud" | null;

export function ReceiptModal({
  open,
  onOpenChange,
  receipt,
  whatsapp = null,
  notice = null,
  celebrate = false,
}: ReceiptModalProps) {
  const toast = useToast();
  const [busy, setBusy] = useState<BusyAction>(null);

  const paymentId = receipt?.id ?? null;

  const handleDownload = useCallback(async () => {
    if (!receipt || !paymentId) {
      toast.error("Receipt unavailable", "The receipt is not ready yet. Try again from Payments.");
      return;
    }
    setBusy("pdf");
    try {
      const blob = await fetchPaymentReceiptPdf(paymentId);
      downloadBlob(blob, receiptFileName(receipt));
      toast.success("PDF ready", `${receipt.receiptNumber} was downloaded.`);
    } catch (error) {
      toast.error(
        "Couldn't download PDF",
        error instanceof ApiError ? error.message : "Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }, [paymentId, receipt, toast]);

  const handlePrint = useCallback(() => {
    if (!receipt) return;
    printReceipt();
  }, [receipt]);

  const handleWhatsApp = useCallback(() => {
    const url = preferredWhatsAppUrl(receipt, whatsapp?.url);
    if (!url) {
      toast.warning(
        "No WhatsApp number",
        "This member has no usable mobile number. Update the profile and try again.",
      );
      return;
    }
    setBusy("whatsapp");
    const opened = openExternal(url);
    setBusy(null);
    if (!opened) {
      toast.warning(
        "Popup blocked",
        "Allow popups for this site, or copy the receipt link instead.",
      );
    } else {
      toast.success("Opening WhatsApp", "Review the message and press send.");
    }
  }, [receipt, toast, whatsapp?.url]);

  const handleCopyLink = useCallback(async () => {
    if (!receipt?.links.pdf) {
      toast.warning("Link unavailable", "The secure receipt link is not ready yet.");
      return;
    }
    setBusy("copy");
    const copied = await copyText(receipt.links.pdf);
    setBusy(null);
    if (copied) {
      toast.success("Link copied", "Anyone with this temporary link can open the PDF.");
    } else {
      toast.error("Couldn't copy", "Your browser blocked clipboard access.");
    }
  }, [receipt, toast]);

  const handleCloudSend = useCallback(async () => {
    if (!paymentId) return;
    setBusy("cloud");
    try {
      await sendReceiptViaWhatsAppCloud(paymentId);
      toast.success("Receipt sent", "WhatsApp delivered the PDF automatically.");
    } catch (error) {
      toast.error(
        "Couldn't send automatically",
        error instanceof ApiError
          ? error.message
          : "Use the WhatsApp button to share it manually.",
      );
    } finally {
      setBusy(null);
    }
  }, [paymentId, toast]);

  if (!receipt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle>Receipt unavailable</DialogTitle>
          <DialogDescription className="mt-1.5">
            {notice || "The receipt could not be prepared. The payment itself is safe."}
          </DialogDescription>
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] max-w-[1060px] flex-col overflow-hidden p-0">
        <div
          data-receipt-chrome
          className="flex shrink-0 items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:px-6"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
              Payment receipt
            </p>
            <DialogTitle className="mt-0.5 truncate font-mono text-base">
              {receipt.receiptNumber}
            </DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-[11.5px]">
              {receipt.member.name} · {receipt.payment.dateLabel} · {receipt.payment.modeLabel}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close receipt"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card-hover hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {(celebrate || notice) && (
          <div data-receipt-chrome className="shrink-0 px-5 pt-3 sm:px-6">
            {notice ? (
              <p className="rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2 text-[11.5px] font-medium text-warning">
                {notice}
              </p>
            ) : (
              <p className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2 text-[11.5px] font-medium text-success">
                <CheckCircle2 className="mt-px size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                Payment recorded. The receipt is saved and ready to share.
              </p>
            )}
          </div>
        )}

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          <ReceiptPreview receipt={receipt} printable />
        </div>

        <div
          data-receipt-chrome
          className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line/70 px-4 py-3 sm:px-5"
        >
          <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            disabled={busy === "pdf" || !paymentId}
          >
            {busy === "pdf" ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <Download className="size-4" strokeWidth={2} aria-hidden />
            )}
            {busy === "pdf" ? "Preparing…" : "Download PDF"}
          </Button>

          <Button variant="secondary" size="md" onClick={handlePrint}>
            <Printer className="size-4" strokeWidth={1.75} aria-hidden />
            Print
          </Button>

          <Button
            size="md"
            onClick={handleWhatsApp}
            className={cn(
              "border-[#1faa53] bg-[#1faa53] text-white hover:border-[#188a43] hover:bg-[#188a43]",
            )}
          >
            <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
            WhatsApp
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={handleCopyLink}
            disabled={busy === "copy" || !receipt.links.pdf}
          >
            {busy === "copy" ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <Copy className="size-4" strokeWidth={1.75} aria-hidden />
            )}
            Copy link
          </Button>

          {receipt.links.pdf && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => openExternal(receipt.links.pdf)}
            >
              <ExternalLink className="size-4" strokeWidth={1.75} aria-hidden />
              Open PDF
            </Button>
          )}

          {whatsapp?.cloudAvailable && paymentId && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleCloudSend}
              disabled={busy === "cloud"}
              title="Send the PDF automatically with the WhatsApp Business Cloud API"
            >
              {busy === "cloud" ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
              ) : (
                <Share2 className="size-4" strokeWidth={1.75} aria-hidden />
              )}
              Send via API
            </Button>
          )}

          <p className="ml-auto hidden text-[10.5px] text-faint sm:block">
            PDF link expires{" "}
            {receipt.links.expiresAt
              ? new Date(receipt.links.expiresAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "automatically"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
