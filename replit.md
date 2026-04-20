# FlashHunt Workspace

## Overview

FlashHunt is a Progressive Web App (PWA) — a weekly street scavenger hunt where users photograph 10 real-world objects using AI object detection. Features Neo-Brutalist dark mode UI, social rankings, and a friend system.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/flashhunt)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Supabase Auth (Google + email/password)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **UI**: Tailwind CSS, Framer Motion, shadcn/ui components
- **Theme**: Neo-Brutalist dark mode — electric yellow (#CCFF00) + violet (#8B5CF6) on black

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Frontend (artifacts/flashhunt)
- `/auth` — Supabase login/signup (Google + email/password)
- `/hunt` — Weekly hunt item list with found/unfound status
- `/camera/:itemId` — Live camera + simulated object detection
- `/rankings` — Triple leaderboard: Global, Local (city), Friends
- `/friends` — Friend search, requests, crew list
- `/profile` — User stats and photo mosaic export

### Backend (artifacts/api-server)
- Auth middleware: Supabase JWT verification in `src/middlewares/supabase-auth.ts`
- Routes: auth, hunt, submissions, rankings, friends, users

### Database Schema (lib/db/src/schema/)
- `users` — User profiles with totalPoints
- `hunts` + `hunt_items` — Weekly hunts with 10 items each
- `submissions` — Photo submissions with points, detection data
- `friend_requests` + `friendships` — Social graph

## Environment Variables Required

For full functionality:
- `SUPABASE_URL` — Supabase project URL (backend)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (backend)
- `VITE_SUPABASE_URL` — Supabase project URL (frontend)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (frontend)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
