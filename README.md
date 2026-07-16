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

## Tech stack

- React 19 + Vite
- Tailwind CSS
- React Router
- Supabase (Auth + Postgres, with Row Level Security)
- Recharts (Analytics charts)
- jsPDF (PDF export)
- lucide-react icons
