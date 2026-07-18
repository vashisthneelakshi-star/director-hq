// Admin access is controlled by the VITE_ADMIN_EMAILS env var — a comma
// separated list of director emails allowed to manage other accounts.
// Set it in Vercel Project Settings > Environment Variables, e.g.
//   VITE_ADMIN_EMAILS=piyush.vashisth2000@gmail.com,neelakshi@patrika.com
export function isAdminEmail(email) {
  if (!email) return false;
  const allowlist = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
