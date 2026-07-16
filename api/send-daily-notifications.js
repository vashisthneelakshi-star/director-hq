import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// This endpoint is triggered daily by Vercel Cron (see vercel.json).
// It looks up, for every director, whether they have any meetings or
// tasks due *today*, and if so sends a web push notification to every
// device they've subscribed on.

export default async function handler(req, res) {
  // Vercel Cron sends a GET request. Reject anything else / unauthorized calls.
  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !vapidPublic || !vapidPrivate) {
    return res.status(500).json({ error: "Missing required environment variables" });
  }

  webpush.setVapidDetails("mailto:notifications@director-hq.app", vapidPublic, vapidPrivate);

  // service role key bypasses RLS so we can read across all directors
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [{ data: meetings, error: meetingsErr }, { data: tasks, error: tasksErr }, { data: subs, error: subsErr }] =
    await Promise.all([
      supabase.from("meetings").select("owner_id, title").eq("date", today).neq("status", "cancelled"),
      supabase.from("tasks").select("owner_id, title").eq("due_date", today).neq("status", "done"),
      supabase.from("push_subscriptions").select("owner_id, subscription, endpoint"),
    ]);

  if (meetingsErr || tasksErr || subsErr) {
    return res.status(500).json({ error: (meetingsErr || tasksErr || subsErr).message });
  }

  // Build a per-owner summary of what's due today
  const byOwner = new Map();
  for (const m of meetings || []) {
    if (!byOwner.has(m.owner_id)) byOwner.set(m.owner_id, { meetings: 0, tasks: 0 });
    byOwner.get(m.owner_id).meetings += 1;
  }
  for (const t of tasks || []) {
    if (!byOwner.has(t.owner_id)) byOwner.set(t.owner_id, { meetings: 0, tasks: 0 });
    byOwner.get(t.owner_id).tasks += 1;
  }

  const results = [];
  const staleEndpoints = [];

  for (const [ownerId, counts] of byOwner.entries()) {
    const ownerSubs = (subs || []).filter((s) => s.owner_id === ownerId);
    if (ownerSubs.length === 0) continue;

    const parts = [];
    if (counts.meetings > 0) parts.push(`${counts.meetings} meeting${counts.meetings > 1 ? "s" : ""}`);
    if (counts.tasks > 0) parts.push(`${counts.tasks} task${counts.tasks > 1 ? "s" : ""} due`);
    const body = `You have ${parts.join(" and ")} today.`;

    const payload = JSON.stringify({
      title: "Director HQ — Today's Agenda",
      body,
      url: "/",
    });

    for (const s of ownerSubs) {
      try {
        await webpush.sendNotification(s.subscription, payload);
        results.push({ ownerId, endpoint: s.endpoint, ok: true });
      } catch (err) {
        // 404/410 means the subscription is dead (browser data cleared, etc.) — clean it up
        if (err.statusCode === 404 || err.statusCode === 410) staleEndpoints.push(s.endpoint);
        results.push({ ownerId, endpoint: s.endpoint, ok: false, error: err.message });
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return res.status(200).json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
}
