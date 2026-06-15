import crypto from "crypto";

/** Generate a cryptographically secure URL-safe token */
export function generateToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/** Format cents as currency string */
export function formatCurrency(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** Default proposal expiry: 30 days from now */
export function defaultExpiry(days = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
