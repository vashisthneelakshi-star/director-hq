# Director HQ — Command Center

A personal dashboard for tracking meetings, daily tasks, and website credentials — built with React, Vite, Tailwind CSS, and React Router.

## Features

- **Overview** — daily stats plus clickable breakdowns: overdue/in-progress/done tasks and upcoming/completed/cancelled meetings. Every stat card and list row is clickable and jumps straight to the filtered list or opens that item's detail view.
- **Meetings** — schedule meetings, switch between list/calendar view, search and filter by status, click any meeting to view/edit/delete it
- **Daily Tasks** — add tasks with priority + a deadline, move a task through To Do → In Progress → Done via a status dropdown, overdue tasks are flagged automatically once the deadline passes, click any task to view/edit/delete it
- **Credentials** — store site logins with reveal/copy-to-clipboard, search by site or username, **download all credentials as Excel (CSV) or PDF**

All data is stored locally in your browser via `localStorage` — nothing is sent to a server.

> ⚠️ **Security note:** the Credentials Vault stores entries in plain-text `localStorage`, with no encryption. It's fine for casual personal use on a device only you access, but it is **not** a substitute for a real password manager (1Password, Bitwarden, etc.) if you're storing sensitive production passwords.

## Getting started

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

```bash
npm i -g vercel
vercel
```

Or connect the GitHub repo directly in the Vercel dashboard — it auto-detects the Vite build settings (`npm run build`, output dir `dist`).

## Tech stack

- React 18 + Vite
- Tailwind CSS
- React Router
- lucide-react icons
