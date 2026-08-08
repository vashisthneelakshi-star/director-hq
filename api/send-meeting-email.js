import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Called directly from the logged-in app (Meeting invite button, MoM "Send
// reminder" button). Requires a valid Supabase session token so random
// people can't use this as an open mail relay.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!supabaseUrl || !anonKey || !gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Missing required environment variables" });
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const senderName = userData.user.user_metadata?.full_name || userData.user.email;
  const senderEmail = userData.user.email;

  const { to, subject, html, text } = req.body || {};
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: "Missing to / subject / body" });
  }

  const recipients = Array.isArray(to)
    ? to
    : String(to)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  if (recipients.length === 0) {
    return res.status(400).json({ error: "No valid recipient email found" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      // The email still physically sends through the shared Gmail account
      // (Gmail won't let us forge the actual From address), but the display
      // name shows who it's really from, and replies go straight to them.
      from: `"${senderName} (via Director HQ)" <${gmailUser}>`,
      replyTo: senderEmail,
      to: recipients.join(","),
      subject,
      text: text || undefined,
      html: html || undefined,
    });
    return res.status(200).json({ ok: true, sentTo: recipients });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
