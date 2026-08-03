import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Triggered daily by Vercel Cron (see vercel.json). Looks across every
// director's Minutes of Meeting action items for anything whose "Date of
// Completion" is today or already overdue, and — if an email address was
// given for that row and a reminder hasn't already been sent — emails the
// assignee a follow-up automatically.

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function handler(req, res) {
  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey || !gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Missing required environment variables" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const today = new Date().toISOString().slice(0, 10);

  const { data: items, error } = await supabase
    .from("mom_items")
    .select("id, topic, assign_to, assign_to_email, date_of_completion, followup_remark, meetings(title)")
    .lte("date_of_completion", today)
    .is("reminder_sent_at", null)
    .not("assign_to_email", "is", null);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const results = [];

  for (const item of items || []) {
    if (!item.assign_to_email) continue;
    const meetingTitle = item.meetings?.title || "Meeting";
    try {
      await transporter.sendMail({
        from: `"Director HQ" <${gmailUser}>`,
        to: item.assign_to_email,
        subject: `Follow-up: ${item.topic || "Action item"} — ${meetingTitle}`,
        html: `
          <div style="font-family:Georgia,serif;color:#1f2937">
            <h2 style="margin-bottom:4px;">Follow-up Reminder</h2>
            <p style="color:#6b7280;margin-top:0;">Meeting: ${meetingTitle}</p>
            <table style="border-collapse:collapse;margin-top:12px;" cellpadding="8">
              <tr><td style="border:1px solid #e5e7eb;"><b>Topic</b></td><td style="border:1px solid #e5e7eb;">${item.topic || ""}</td></tr>
              <tr><td style="border:1px solid #e5e7eb;"><b>Assigned To</b></td><td style="border:1px solid #e5e7eb;">${item.assign_to || ""}</td></tr>
              <tr><td style="border:1px solid #e5e7eb;"><b>Date of Completion</b></td><td style="border:1px solid #e5e7eb;">${fmtDate(item.date_of_completion)}</td></tr>
              <tr><td style="border:1px solid #e5e7eb;"><b>Remark</b></td><td style="border:1px solid #e5e7eb;">${item.followup_remark || ""}</td></tr>
            </table>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sent automatically via Director HQ</p>
          </div>`,
      });
      await supabase.from("mom_items").update({ reminder_sent_at: new Date().toISOString() }).eq("id", item.id);
      results.push({ id: item.id, ok: true });
    } catch (err) {
      results.push({ id: item.id, ok: false, error: err.message });
    }
  }

  return res.status(200).json({
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
