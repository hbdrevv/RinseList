// Basic email validation regex
// Intentionally permissive - catches obvious format issues without being overly strict
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return EMAIL_REGEX.test(trimmed);
}

export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }
  return email.trim().toLowerCase();
}
