export function isAllowedEmail(email: string | undefined): boolean {
  if (!email) {
    return false;
  }
  const allowed = (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
