# Director HQ — Command Center

A personal dashboard for tracking meetings, daily tasks, and website credentials — built with React, Vite, Tailwind CSS, and React Router.

## Features

- **Overview** — daily stats (today's meetings, pending tasks, saved credentials) plus upcoming meetings and high-priority tasks at a glance
- **Meetings** — schedule meetings, switch between list/calendar view, search and filter by status
- **Daily Tasks** — add tasks with priority levels, filter by status/priority, mark complete
- **Credentials** — store site logins with reveal/copy-to-clipboard, search by site or username

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
