"use client";

import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Printer,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [view, setView] = useState<"design" | "pdf">("design");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfState, setPdfState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfReload, setPdfReload] = useState(0);
  const pdfUrlRef = useRef<string | null>(null);

  const paymentId = receipt?.id ?? null;

  // A new receipt (or reopening the dialog) always starts on the design view.
  useEffect(() => {
    if (!open) {
      setView("design");
      setPdfState("idle");
      setPdfError(null);
    }
  }, [open, paymentId]);

  // Render the real PDF in an iframe on demand. The blob URL is revoked when
  // the user switches back to the design, closes the dialog, or changes receipt.
  useEffect(() => {
    if (!open || view !== "pdf" || !paymentId) return;

    let active = true;
    let objectUrl: string | null = null;

    setPdfState("loading");
    setPdfError(null);

    fetchPaymentReceiptPdf(paymentId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        pdfUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
        setPdfState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setPdfState("error");
        setPdfError(
          error instanceof ApiError
            ? error.message
            : "Couldn't load the PDF preview.",
        );
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (pdfUrlRef.current === objectUrl) pdfUrlRef.current = null;
      setPdfUrl(null);
    };
  }, [open, view, paymentId, pdfReload]);

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
    // Printing targets the on-screen sheet, so switch away from the PDF tab
    // and give React a frame to mount it before opening the print dialog.
    if (view !== "design") {
      setView("design");
      window.setTimeout(printReceipt, 80);
      return;
    }
    printReceipt();
  }, [receipt, view]);

  /**
   * Sends the real PDF through the WhatsApp Business Cloud API when the gym
   * has credentials. Without them, opens the pre-filled wa.me chat so the
   * member still receives a link to the secure PDF.
   */
  const handleCloudSend = useCallback(async () => {
    if (!paymentId) return;
    setBusy("cloud");
    try {
      const result = await sendReceiptViaWhatsAppCloud(paymentId);
      toast.success(
        "Receipt sent",
        result.delivery === "link"
          ? "WhatsApp delivered the receipt PDF from the secure link."
          : "WhatsApp delivered the receipt PDF automatically.",
      );
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

  const handleWhatsApp = useCallback(() => {
    if (whatsapp?.cloudAvailable && paymentId) {
      void handleCloudSend();
      return;
    }

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
  }, [
    handleCloudSend,
    paymentId,
    receipt,
    toast,
    whatsapp?.cloudAvailable,
    whatsapp?.url,
  ]);

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

        <div
          data-receipt-chrome
          className="flex shrink-0 items-center gap-1 border-b border-line/70 px-3 py-2 sm:px-4"
        >
          <button
            type="button"
            onClick={() => setView("design")}
            aria-pressed={view === "design"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
              view === "design"
                ? "bg-gold/12 text-gold"
                : "text-subtle hover:bg-card-hover hover:text-ink",
            )}
          >
            <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setView("pdf")}
            aria-pressed={view === "pdf"}
            disabled={!paymentId}
            title={
              paymentId
                ? "Load the generated PDF"
                : "Save the payment before previewing the PDF"
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              view === "pdf"
                ? "bg-gold/12 text-gold"
                : "text-subtle hover:bg-card-hover hover:text-ink",
            )}
          >
            <FileText className="size-3.5" strokeWidth={1.75} aria-hidden />
            PDF
          </button>
          <span className="ml-auto hidden text-[10.5px] text-faint sm:block">
            Exact copy of the file members receive
          </span>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          {view === "design" ? (
            <ReceiptPreview receipt={receipt} printable />
          ) : (
            <div className="mx-auto w-full max-w-[900px]">
              {pdfState === "loading" && (
                <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-line/60 bg-canvas/40">
                  <Loader2
                    className="size-6 animate-spin text-gold"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <p className="text-[12px] text-subtle">Rendering the PDF…</p>
                </div>
              )}

              {pdfState === "error" && (
                <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-danger/40 bg-danger/5 px-6 text-center">
                  <AlertCircle
                    className="size-7 text-danger"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-ink">
                      Couldn&apos;t load the PDF
                    </p>
                    <p className="mt-1 text-[11.5px] text-subtle">
                      {pdfError ?? "Please try again."}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPdfReload((value) => value + 1)}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {pdfState === "ready" && pdfUrl && (
                <iframe
                  src={pdfUrl}
                  title={`Receipt ${receipt.receiptNumber} PDF preview`}
                  className="h-[68vh] min-h-[520px] w-full rounded-lg border border-line/60 bg-white"
                />
              )}
            </div>
          )}
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
            disabled={busy === "cloud" || busy === "whatsapp"}
            title={
              whatsapp?.cloudAvailable
                ? "Send the PDF automatically with the WhatsApp Business Cloud API"
                : "Open WhatsApp with the receipt link and a personalised message"
            }
            className={cn(
              "border-[#1faa53] bg-[#1faa53] text-white hover:border-[#188a43] hover:bg-[#188a43]",
            )}
          >
            {busy === "cloud" || busy === "whatsapp" ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
            )}
            {busy === "cloud" ? "Sending PDF…" : "Send on WhatsApp"}
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
