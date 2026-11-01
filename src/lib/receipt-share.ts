/**
 * Browser helpers for sharing, downloading and printing a receipt.
 *
 * WhatsApp is opened through a pre-opened tab whenever possible: browsers only
 * allow `window.open` inside the original click, and the receipt URL does not
 * exist until the payment request finishes. The pre-opened tab is navigated
 * once the server responds; if anything fails it is closed again and the
 * committed payment is never affected.
 */

import type { ReceiptPayload } from "./receipt-api";

/** Opens a blank tab synchronously inside the user's submit gesture. */
export function openShareWindow(): Window | null {
  if (typeof window === "undefined") return null;
  try {
    // Passing "noopener" makes window.open() return null in Chrome, which
    // would leave us holding no handle. Open normally, then sever `opener`
    // while the tab is still same-origin about:blank.
    const win = window.open("about:blank", "_blank");
    if (win) {
      try {
        win.opener = null;
      } catch {
        // Cross-origin policies may block this; the fallback still works.
      }
    }
    return win;
  } catch {
    return null;
  }
}

/** Navigates the pre-opened tab, falling back to a normal new tab. */
export function navigateShareWindow(win: Window | null, url: string): boolean {
  if (!url) return false;
  if (win && !win.closed) {
    try {
      win.location.href = url;
      return true;
    } catch {
      // Some browsers refuse cross-origin assignment on a noopener tab.
    }
  }
  return openExternal(url);
}

/** Opens a URL in a new tab and reports whether the browser allowed it. */
export function openExternal(url: string): boolean {
  if (!url || typeof window === "undefined") return false;
  try {
    // "noopener" in the feature string makes window.open() return null, which
    // is indistinguishable from a blocked popup. Open, then sever `opener`.
    const win = window.open(url, "_blank");
    if (!win) return false;
    try {
      win.opener = null;
    } catch {
      // Cross-origin opener access may be denied; the tab still opened.
    }
    return true;
  } catch {
    return false;
  }
}

export function closeShareWindow(win: Window | null): void {
  if (!win) return;
  try {
    if (!win.closed) win.close();
  } catch {
    // Nothing to clean up.
  }
}

/** WhatsApp deep link built from the server payload (phone already normalized). */
export function receiptWhatsAppUrl(receipt: ReceiptPayload | null): string | null {
  if (!receipt?.whatsapp?.phone) return null;
  return `https://wa.me/${receipt.whatsapp.phone}?text=${encodeURIComponent(
    receipt.whatsapp.message,
  )}`;
}

/** Uses the server URL when present, otherwise rebuilds it from the payload. */
export function preferredWhatsAppUrl(
  receipt: ReceiptPayload | null,
  serverUrl?: string | null,
): string | null {
  return serverUrl || receiptWhatsAppUrl(receipt);
}

export function receiptFileName(receipt: ReceiptPayload | null): string {
  const number = receipt?.receiptNumber || "receipt";
  const safe = number.replace(/[^A-Za-z0-9._-]/g, "-");
  return `Receipt-${safe}.pdf`;
}

/** Saves a Blob through a temporary object URL. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copies text, falling back to a hidden textarea when the async clipboard API
 * is unavailable (for example an insecure preview origin).
 */
export async function copyText(value: string): Promise<boolean> {
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

/**
 * Prints only the receipt sheet. The `receipt-printing` body class switches the
 * print stylesheet in `globals.css`; it is removed after the dialog closes.
 */
export function printReceipt(): void {
  if (typeof window === "undefined") return;

  const cleanup = () => {
    document.body.classList.remove("receipt-printing");
    window.removeEventListener("afterprint", cleanup);
  };

  document.body.classList.add("receipt-printing");
  window.addEventListener("afterprint", cleanup);
  // Give the browser a frame to apply the print-only visibility rules.
  window.setTimeout(() => {
    try {
      window.print();
    } finally {
      // `afterprint` fires in modern browsers; this is a safety net for the
      // ones that do not (and for a cancelled print dialog).
      window.setTimeout(cleanup, 1000);
    }
  }, 30);
}
