/**
 * Shared input sanitization utilities for all frontend forms.
 * Prevents XSS, script injection, and enforces strict input types.
 */

/** Strip dangerous characters, JS protocol, event handlers, null bytes */
export function sanitizeInput(str: string, maxLength = 500): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>'"`;\\]/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/&#/g, "")
    .replace(/\x00/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

/** Validate Singapore phone number (8 digits) */
export function isValidPhone(phone: string): boolean {
  return /^\d{8}$/.test(phone);
}

/** Sanitize and normalize email */
export function sanitizeEmail(email: string): string {
  return sanitizeInput(email, 200).toLowerCase();
}
