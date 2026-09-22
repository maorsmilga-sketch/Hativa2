/** Comma-separated admin Google emails in VITE_ADMIN_EMAILS */
export function getAdminEmails() {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const allowed = getAdminEmails();
  if (allowed.length === 0) {
    console.warn('VITE_ADMIN_EMAILS is empty — no admin emails configured');
    return false;
  }
  return allowed.includes(email.toLowerCase());
}
