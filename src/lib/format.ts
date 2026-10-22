/**
 * App-wide money formatter. Billing is in Indian rupees, so amounts use the
 * rupee symbol and Indian digit grouping (e.g. ₹1,84,920).
 */
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

/**
 * Expense accounting formatter that always shows paise. The API stores money in
 * paise, so callers convert with `paiseToAmount` first.
 */
const inrCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrCompactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrencyInr(value: number): string {
  return inrCurrencyFormatter.format(value);
}

export function formatCompactCurrencyInr(value: number): string {
  return inrCompactCurrencyFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(Math.abs(value))}%`;
}

/** "12 Oct" — short, dashboard-friendly date label. */
export function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
