# lost time

An asocial network — a members-only society of great minds connecting through the Proust questionnaire.

## Tech stack
- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth
- **Email:** Resend
- **Hosting:** GitHub Pages + Custom domain (lost-time.org)

## Features
- Multi-language questionnaire (English, French, Italian)
- Member profiles with anonymous member numbers
- 1-on-1 conversations between members (10 messages each)
- Admin dashboard for approving/rejecting applications
- Email notifications for new applications and messages
- Real-time message updates via Supabase Realtime

## Getting started
```bash
npm install
npm run dev
```

## Deployment
Pushes to `main` trigger GitHub Actions to deploy to `https://lost-time.org`.
