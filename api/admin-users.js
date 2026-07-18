import { createClient } from "@supabase/supabase-js";

// Admin panel backend.
// GET  -> list every director account (id, email, name, created/last-login)
// POST -> update a director's email and/or password (used when handing an
//         account over to a new employee). This only changes login
//         credentials — the auth user id stays the same, so every meeting,
//         task, credential and note already owned by that account (via
//         owner_id) stays exactly where it is and is immediately visible
//         to whoever logs in next.
//
// Only callers whose email is in VITE_ADMIN_EMAILS may use this endpoint.

function getAdminEmails() {
  return (process.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return res.status(500).json({ error: "Missing required environment variables" });
  }

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  // Identify the caller from their own session token.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: callerData, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerData?.user) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const adminEmails = getAdminEmails();
  const callerEmail = (callerData.user.email || "").toLowerCase();
  if (adminEmails.length === 0) {
    return res.status(500).json({ error: "VITE_ADMIN_EMAILS is not configured" });
  }
  if (!adminEmails.includes(callerEmail)) {
    return res.status(403).json({ error: "Not authorized — admin access only" });
  }

  // service role client — bypasses RLS, can manage auth users
  const admin = createClient(supabaseUrl, serviceRoleKey);

  if (req.method === "GET") {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error) return res.status(500).json({ error: error.message });
    const users = data.users
      .map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name || "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at || null,
      }))
      .sort((a, b) => (a.fullName || a.email).localeCompare(b.fullName || b.email));
    return res.status(200).json({ users });
  }

  if (req.method === "POST") {
    const { userId, email, password, fullName } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const patch = {};
    if (email) patch.email = email;
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      patch.password = password;
    }
    if (fullName !== undefined) patch.user_metadata = { full_name: fullName };

    if (Object.keys(patch).length === 0) return res.status(400).json({ error: "Nothing to update" });

    const { data, error } = await admin.auth.admin.updateUserById(userId, patch);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
      success: true,
      user: { id: data.user.id, email: data.user.email, fullName: data.user.user_metadata?.full_name || "" },
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
