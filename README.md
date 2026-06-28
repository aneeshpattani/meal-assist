# Meal Assist

A lightweight meal-planning assistant for households. Share a dish library and weekly planner with your family.

## Quick start (local dev)

```bash
npm install
cp .env.local.example .env.local   # Fill in your Supabase credentials
npm run dev
```

## Features

- **Dish Library** — create, edit, and delete dishes with name, meal types, and ingredients.
- **Weekly Planner** — assign dishes to a 7-day x meal-type grid; filters by meal type.
- **Shared household** — multiple users share the same dishes and plan via invite code.
- **Magic-link auth** — passwordless sign-in via email (Supabase Auth).

## Architecture

```
src/
├── app/            Next.js App Router pages (login, onboarding, main)
├── components/     DishLibrary, DishForm, WeeklyPlanner
├── data/           Repository interfaces + Supabase implementation
├── domain/         Types, nutrition scaffolding, grocery scaffolding
├── hooks/          useSupabase, useHousehold
└── lib/supabase/   Client and server Supabase helpers
```

Data flows through a `DishRepository` / `PlanRepository` interface backed by Supabase (Postgres + RLS). Each household has isolated data.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import in [Vercel](https://vercel.com) — framework auto-detected as Next.js.
3. Set environment variables in Vercel (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Add the resulting URL to Supabase **Auth → Redirect URLs**.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Enable **Email** provider with **Magic Link** in Authentication settings.
3. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor.
4. Copy Project URL and anon key from Settings → API into your env vars.

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key |
