# Director HQ — Command Center

A multi-user dashboard for directors to track meetings, daily tasks, credentials, notes, analytics, and reports — built with React, Vite, Tailwind CSS, React Router, and Supabase (Auth + Postgres).

## Features

- **Overview** — daily stats plus clickable breakdowns of tasks and meetings
- **Meetings** — schedule meetings, list/calendar view, search and filter by status
- **Daily Tasks** — priority + deadline, status tracking (To Do → In Progress → Done), overdue auto-flagged
- **Credentials** — store site logins with reveal/copy-to-clipboard, export as CSV or PDF
- **Analytics** — meetings per week, meeting status split, tasks completed per day, tasks by priority, streaks
- **Notes** — quick notes with autosave
- **Reports** — export meetings, tasks, credentials and notes as CSV or PDF, plus a one-click productivity summary PDF
- **Accounts** — each director signs up with their own email/password (Supabase Auth); every director only ever sees their own data
- **Mobile-friendly** — collapsible sidebar/drawer nav on small screens

## 1. Set up Supabase (one-time)

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `meetings`, `tasks`, `credentials`, and `notes` tables with Row Level Security so each director only sees their own rows.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. By default Supabase requires email confirmation for new signups. To turn that off for internal/testing use: **Authentication → Providers → Email → uncheck "Confirm email"**.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from step 1.

For the **Vercel deployment**, add the same two variables in **Project → Settings → Environment Variables**, then redeploy.

## Getting started (local dev)

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for production

```bash
npm run build
npm run preview
```

## Deploy to Vercel

Connect the GitHub repo in the Vercel dashboard — it auto-detects the Vite build settings (`npm run build`, output dir `dist`). Make sure the two `VITE_SUPABASE_*` environment variables are set in the Vercel project before deploying.

## 3. Set up daily push notifications (optional)

Directors can enable a daily reminder ("you have N meetings / M tasks today") that arrives as a browser/mobile push notification, sent automatically every morning.

1. Run the updated `supabase/schema.sql` again in the SQL Editor (it now also creates a `push_subscriptions` table — safe to re-run, it's all `if not exists`).
2. Generate VAPID keys locally: `npx web-push generate-vapid-keys`.
3. In your `.env.local` (and in Vercel Project → Settings → Environment Variables), set:
   - `VITE_VAPID_PUBLIC_KEY` — the public key (also used by the frontend)
   - `VAPID_PRIVATE_KEY` — the private key (server-side only, do **not** prefix with `VITE_`)
   - `SUPABASE_SERVICE_ROLE_KEY` — from Project Settings → API → `service_role` key (server-side only)
   - `CRON_SECRET` — any random string, e.g. `openssl rand -hex 32`
4. Redeploy on Vercel. The `crons` entry in `vercel.json` will call `/api/send-daily-notifications` every day at 1:30 AM UTC (~7:00 AM IST) — adjust the cron schedule if you're in a different timezone.
5. Each director opens the app, goes to the Overview page, and clicks **"Enable reminders"** under Daily reminders. Their browser will ask for notification permission — once accepted, they'll get a notification each morning if they have a meeting or task due that day.

Note: on iPhone, push notifications only work if the site is added to the Home Screen first (Safari → Share → Add to Home Screen), due to an iOS restriction. On Android/desktop it works directly in the browser.

## 4. Set up meeting emails (Agenda invite + Minutes of Meeting reminders)

Meetings now support an **Agenda** field, a **"Send invite by email"** button (sends the agenda straight to any email address), and a **Minutes of Meeting** window (S.No, Topic, Assign To, Email, Date of Completion, Follow-up Remark) with a manual **"Send reminder"** button per row, plus an automatic daily reminder for anything whose Date of Completion is today or overdue.

1. Run the updated `supabase/schema.sql` again in the SQL Editor (adds an `agenda` column to `meetings` and a new `mom_items` table — safe to re-run).
2. Get a **Gmail App Password** for the company Gmail account that should send these emails:
   - Go to your Google Account → Security → 2-Step Verification (must be turned on) → App passwords.
   - Create one for "Mail" and copy the 16-character password.
3. In your `.env.local` (and in Vercel Project → Settings → Environment Variables), set:
   - `GMAIL_USER` — the sending Gmail address, e.g. `directorhq.notifications@gmail.com`
   - `GMAIL_APP_PASSWORD` — the 16-character app password from step 2 (no spaces)
4. Redeploy on Vercel. `vercel.json` now also runs `/api/send-followup-reminders` daily at 3:30 AM UTC (~9:00 AM IST) to auto-email anyone whose action item is due/overdue and has an email on file — it only sends once per row (tracked via `reminder_sent_at`).

Note: the "Assign To" field in Minutes of Meeting is just a name; add the person's email in the adjacent **Email** field if you want reminders to actually go out for that row.

## 5. To-Do List, Calendar, and the 10 AM morning reminder

Two new sidebar buttons:
- **To-Do List** — a quick Microsoft-To-Do-style checklist (separate from the more detailed "Daily Tasks" module): type and hit Enter to add, checkbox to complete, star to mark important, click an item for notes/due date.
- **Calendar** — a month grid where clicking any day opens a note box to write what's happening that day. A preview of the note shows right on the day cell.

Both are backed by the `todos` and `calendar_notes` tables added in the updated `supabase/schema.sql` — run it again in the SQL Editor (safe to re-run).

**Automatic 10 AM reminder** (`/api/send-morning-reminders`, cron at `30 4 * * *` = ~10:00 AM IST): every morning it looks at each director's to-do items due today (or overdue) and today's calendar note, then emails the summary to the director's own login email using the same `GMAIL_USER`/`GMAIL_APP_PASSWORD` set up in section 4. Mail-only — no mobile push involved for this one. No extra setup needed beyond section 4 already being configured — just redeploy after adding this update.

## 6. Official vs Personal tasks

Daily Tasks now has two tabs — **Official Task** and **Personal Task** — with independent counts, filters, and search. Every task you add is tagged with whichever tab is active; you can also change a task's type from inside its detail modal (Type dropdown). Run `supabase/schema.sql` again (adds a `task_type` column) — **all existing tasks are automatically migrated to "Official Task"**, nothing gets lost or needs manual re-tagging.

## 7. Install the app on mobile (like a real app, no browser bar)

This update adds a proper PWA manifest with a branded maroon-gold icon, so the app can now be installed on the phone's home screen and opens full-screen like a native app (no address bar), same idea as the desktop install covered earlier.

**Android (Chrome):**
1. Open `director-hq.vercel.app` in Chrome
2. Tap the **⋮ menu** → **"Install app"** (or you'll see an "Add Director HQ to Home screen" banner automatically)
3. Confirm — the branded icon appears on the home screen/app drawer and opens without any browser UI

**iPhone (Safari):**
1. Open the site in Safari (must be Safari, not Chrome, for this to work on iOS)
2. Tap the **Share** icon (square with an arrow) → **"Add to Home Screen"**
3. Confirm — same branded icon, opens full-screen

No extra env vars or setup needed for this — just redeploy after this update and re-install (if it was already added to the home screen before this change, remove and re-add once to pick up the new icon/manifest).

## Tech stack

- React 19 + Vite
- Tailwind CSS
- React Router
- Supabase (Auth + Postgres, with Row Level Security)
- Recharts (Analytics charts)
- jsPDF (PDF export)
- lucide-react icons
