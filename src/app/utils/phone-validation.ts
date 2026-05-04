// Singapore mobile validator. Lead forms across the site use this so the
// rule is consistent: exactly 8 digits, no spaces or symbols, starting with
// 6, 8, or 9 (covers landline, mobile-8x, mobile-9x).
export function isValid8DigitPhone(phone: string): boolean {
  const digits = (phone || "").replace(/\D/g, "");
  return /^\d{8}$/.test(digits);
}

export const PHONE_ERROR_MESSAGE = "Phone number must be exactly 8 digits.";
