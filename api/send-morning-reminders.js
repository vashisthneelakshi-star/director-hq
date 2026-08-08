import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Triggered daily by Vercel Cron at 10:00 AM IST (see vercel.json). For each
// director, gathers: to-do items due today (+ overdue ones still pending)
// and today's calendar note, then emails the summary to their own login
// email (mail-only — no mobile push here).

function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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

  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } });
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: todos, error: todosErr }, { data: notes, error: notesErr }, { data: usersData, error: usersErr }] = await Promise.all([
    admin.from("todos").select("owner_id, title, due_date").eq("completed", false).lte("due_date", today).not("due_date", "is", null),
    admin.from("calendar_notes").select("owner_id, content").eq("note_date", today),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  if (todosErr || notesErr || usersErr) {
    return res.status(500).json({ error: (todosErr || notesErr || usersErr).message });
  }

  const emailByOwner = new Map((usersData?.users || []).map((u) => [u.id, u.email]));
  const nameByOwner = new Map((usersData?.users || []).map((u) => [u.id, u.user_metadata?.full_name || u.email]));
  const noteByOwner = new Map((notes || []).map((n) => [n.owner_id, n.content]));

  const byOwner = new Map();
  const ensure = (id) => {
    if (!byOwner.has(id)) byOwner.set(id, { dueToday: [], overdue: [] });
    return byOwner.get(id);
  };
  for (const t of todos || []) {
    const bucket = ensure(t.owner_id);
    if (t.due_date === today) bucket.dueToday.push(t.title);
    else bucket.overdue.push(t.title);
  }
  // owners who only have a calendar note and nothing due should still hear about it
  for (const ownerId of noteByOwner.keys()) ensure(ownerId);

  const results = [];

  for (const [ownerId, bucket] of byOwner.entries()) {
    const note = noteByOwner.get(ownerId);
    if (bucket.dueToday.length === 0 && bucket.overdue.length === 0 && !note) continue;

    const to = emailByOwner.get(ownerId);
    if (!to) continue;
    const name = nameByOwner.get(ownerId) || "Director HQ";

    try {
      await transporter.sendMail({
        from: `"${name}'s Director HQ Reminder" <${gmailUser}>`,
        to,
        subject: `Your morning reminder — ${fmtDate(today)}`,
        html: `
          <div style="font-family:Georgia,serif;color:#1f2937;max-width:520px;">
            <h2 style="margin-bottom:4px;">Good morning</h2>
            <p style="color:#6b7280;margin-top:0;">${fmtDate(today)}</p>
            ${bucket.dueToday.length ? `<p><b>Due today:</b><br/>${bucket.dueToday.join("<br/>")}</p>` : ""}
            ${bucket.overdue.length ? `<p style="color:#b91c1c;"><b>Overdue:</b><br/>${bucket.overdue.join("<br/>")}</p>` : ""}
            ${note ? `<p><b>On your calendar today:</b><br/>${note.replace(/\n/g, "<br/>")}</p>` : ""}
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sent automatically every morning via Director HQ</p>
          </div>`,
      });
      results.push({ ownerId, ok: true });
    } catch (err) {
      results.push({ ownerId, ok: false, error: err.message });
    }
  }

  return res.status(200).json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
}
