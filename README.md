# InfiniteBoard v2

Real-time collaborative infinite canvas web application.

## Architecture

The project is split into two independently deployable services:

- **Frontend** (root directory) — Next.js (React) application
- **Backend** (`backend/`) — Express.js REST API server

```
├── src/                  # Frontend (Next.js)
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   └── lib/              # Client & server utilities
├── backend/              # Backend (Express.js API)
│   └── src/
│       ├── index.ts      # Express server entry point
│       ├── routes/       # API route handlers
│       └── lib/          # Supabase & Redis clients
└── supabase/             # Database migrations
```

## Features

- Infinite canvas with pan and zoom
- Multiple element types: text, sticky notes, images, links, freehand strokes
- Real-time multiplayer cursors via Redis presence
- Supabase Realtime element sync
- Coordinate search system — navigate to any x,y point with reply threads

## Setup

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
npm --prefix backend install
```

### 2. Configure environment variables

**Frontend** — copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

**Backend** — copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

### 3. Run database migrations

Run the SQL in `supabase/migrations/001_initial.sql` against your Supabase project.

### 4. Start development servers

Run both frontend and backend together:
```bash
npm run dev:all
```

Or start them separately:
```bash
# Terminal 1 — Frontend (http://localhost:3000)
npm run dev

# Terminal 2 — Backend (http://localhost:3001)
npm run dev:backend
```

> **Note:** When `NEXT_PUBLIC_API_URL` is left empty the frontend falls back to the
> built-in Next.js API routes (under `src/app/api/`), so you can also run
> `npm run dev` alone without starting the Express backend.

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (used by built-in API routes) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (used by built-in API routes) |
| `NEXT_PUBLIC_API_URL` | Base URL of the deployed backend, e.g. `https://api.example.com` (leave empty for local dev) |

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `PORT` | Port for the Express server (default: `3001`) |
| `FRONTEND_URL` | Allowed CORS origin, e.g. `https://app.example.com` |

## Deployment

### Frontend → Vercel

Push the repository and import it in Vercel. Set `NEXT_PUBLIC_API_URL` to your
backend's public URL in the Vercel project settings.

### Backend → Railway / Render / Fly.io

Deploy the `backend/` directory as a separate Node.js service:

```bash
cd backend
npm install
npm run build
npm start
```

Set `FRONTEND_URL` to your frontend's public URL to allow CORS.

## Tech Stack

- **Frontend:** Next.js 15 (App Router, TypeScript), TailwindCSS
- **Backend:** Express.js, TypeScript
- **Database:** Supabase (Postgres + Realtime)
- **Cache:** Upstash Redis (presence & rate limiting)
- **IDs:** nanoid (board code generation)
