import { supabase } from "./supabaseClient";

async function authToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}

async function postEmail(payload) {
  const token = await authToken();
  const res = await fetch("/api/send-meeting-email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Email bhejne me error aaya");
  return json;
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function sendMeetingInviteEmail({ to, form }) {
  const agendaHtml = (form.agenda || "")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<li>${l.replace(/</g, "&lt;")}</li>`)
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;color:#1f2937;max-width:520px;">
      <h2 style="margin-bottom:4px;">${form.title || "Meeting"}</h2>
      <p style="color:#6b7280;margin-top:0;">${fmtDate(form.date)}${form.time ? " • " + form.time : ""}</p>
      ${form.location ? `<p><b>Location:</b> ${form.location}</p>` : ""}
      ${form.attendees ? `<p><b>Attendees:</b> ${form.attendees}</p>` : ""}
      ${agendaHtml ? `<p style="margin-bottom:4px;"><b>Agenda:</b></p><ul style="margin-top:0;">${agendaHtml}</ul>` : ""}
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sent via Director HQ</p>
    </div>`;

  return postEmail({
    to,
    subject: `Meeting Invite: ${form.title || "Meeting"} — ${fmtDate(form.date)}`,
    html,
  });
}

export async function sendFollowupReminderEmail({ meetingTitle, row }) {
  const html = `
    <div style="font-family:Georgia,serif;color:#1f2937;max-width:520px;">
      <h2 style="margin-bottom:4px;">Follow-up Reminder</h2>
      <p style="color:#6b7280;margin-top:0;">Meeting: ${meetingTitle}</p>
      <table style="border-collapse:collapse;margin-top:12px;" cellpadding="8">
        <tr><td style="border:1px solid #e5e7eb;"><b>Topic</b></td><td style="border:1px solid #e5e7eb;">${row.topic || ""}</td></tr>
        <tr><td style="border:1px solid #e5e7eb;"><b>Assigned To</b></td><td style="border:1px solid #e5e7eb;">${row.assignTo || ""}</td></tr>
        <tr><td style="border:1px solid #e5e7eb;"><b>Date of Completion</b></td><td style="border:1px solid #e5e7eb;">${fmtDate(row.dateOfCompletion)}</td></tr>
        <tr><td style="border:1px solid #e5e7eb;"><b>Remark</b></td><td style="border:1px solid #e5e7eb;">${row.followupRemark || ""}</td></tr>
      </table>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sent via Director HQ</p>
    </div>`;

  return postEmail({
    to: row.assignToEmail,
    subject: `Follow-up: ${row.topic || "Action item"} — ${meetingTitle}`,
    html,
  });
}
