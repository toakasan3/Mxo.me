# InfiniteBoard v2

Real-time collaborative infinite canvas web application.

## Features

- Infinite canvas with pan and zoom
- Multiple element types: text, sticky notes, images, links, freehand strokes
- Real-time multiplayer cursors via Redis presence
- Supabase Realtime element sync
- Coordinate search system — navigate to any x,y point with reply threads

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in values:
   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations in your Supabase project (`supabase/migrations/001_initial.sql`).

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- TailwindCSS
- Supabase (Postgres + Realtime)
- Upstash Redis (presence/rate limiting)
- nanoid (board code generation)
