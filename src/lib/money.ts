/**
 * Money is always an integer of minor units. These helpers are the only
 * place that knows how to turn that into something a person reads.
 */

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "XOF", "XAF"]);

function minorPerMajor(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100;
}

export function formatMoney(minor: number, currency = "NGN"): string {
  const value = minor / minorPerMajor(currency);
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    // Small businesses price in round numbers; ".00" is noise.
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  };

  // "narrowSymbol" is what gets us ₦ and GH₵ instead of the ISO code, which
  // is what a customer in Lagos expects to see on a price tag.
  try {
    return new Intl.NumberFormat("en", {
      ...options,
      currencyDisplay: "narrowSymbol",
    }).format(value);
  } catch {
    // Older runtimes reject narrowSymbol; an unknown code rejects both.
  }
  try {
    return new Intl.NumberFormat("en", options).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

/** Parses what an owner actually types: "25,000", "₦25000", "25000.50". */
export function parseMoney(input: string, currency = "NGN"): number | null {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * minorPerMajor(currency));
}

/** The value to prefill a price input with, without currency decoration. */
export function moneyInputValue(minor: number, currency = "NGN"): string {
  const per = minorPerMajor(currency);
  const value = minor / per;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
