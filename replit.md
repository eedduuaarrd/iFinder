# iFinder Workspace

## Overview

iFinder is a Progressive Web App (PWA) — a weekly street scavenger hunt where users photograph 10 real-world objects validated by Gemini AI. The visual identity is a soft glassmorphic dark theme with a teal/coral/amber palette, rounded corners, and gradient accents (replacing the previous neo-brutalist look). Includes social rankings, friends, badges, weekly mosaic, and per-user settings.

## Recent improvements (April 2026)

- **Visual redesign**: warm midnight palette with teal primary, coral secondary, amber accent. Glassmorphic cards, rounded-xl corners, soft shadows, gradient buttons. Replaces hard neo-brutalist shadows.
- **Brand**: renamed to `iFinder` (was FlashHunt) in auth screen and header.
- **Auth**: language switcher removed from header and auth page; lives only in profile settings now. Email + city normalized to lowercase on register/login so login is case-insensitive and the local leaderboard groups people in the same city regardless of capitalization.
- **Profile Settings**: new section in profile lets users edit their city (and language), with save feedback.
- **Weekly hunt rotation**: server now picks 10 items deterministically per week from a 19-item pool (mulberry32 PRNG seeded by week index anchored to 2024-01-01). Items rotate automatically every Monday; same week always shows the same items.
- **Spelling fixes (i18n)**: `RANK` → `RÀNQUING`/`RÁNKING`; `JA HAS CAÇAT AQUEST` → `... AQUEST OBJECTIU`; same in Spanish.
- **Image validation**: still uses Gemini 2.5 Flash with confidence threshold 0.7 + real-photo check.

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
