# AGENTS.md

## Cursor Cloud specific instructions

Meal Assist is a single Next.js 15 (App Router) + React 19 app backed by Supabase
(Postgres + Auth via magic link). There is one service to run for the frontend
(`next dev`) plus a local Supabase stack for auth/data. Standard scripts live in
`package.json` (`dev`, `build`, `start`, `lint`); DB schema is
`supabase/migrations/001_initial_schema.sql`.

### Services

- **Next.js dev server** — `npm run dev` (http://localhost:3000).
- **Local Supabase stack** — run via the Supabase CLI (Postgres 54322, API 54321,
  Studio 54323, Mailpit/Inbucket email UI 54324). Requires Docker.

The update script only runs `npm install`. Docker and the Supabase CLI are
system dependencies provisioned in this environment (not in the update script).
If they are ever missing: install Docker CE and download the `supabase` +
`supabase-go` binaries from the Supabase CLI GitHub releases into `PATH`.

### Starting everything (from a fresh VM)

1. Docker has no systemd here; if `docker ps` fails, start the daemon in the
   background: `sudo dockerd &` (it uses `fuse-overlayfs`, configured in
   `/etc/docker/daemon.json`). If the socket is root-owned, `sudo chmod 666 /var/run/docker.sock`.
2. `supabase start` (first run pulls images; re-runs are fast). This applies the
   migration and `supabase/seed.sql`.
3. Create `.env.local` in the repo root (gitignored) pointing at the local stack:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from `supabase status`>
   ```
   The local anon key is a fixed default; get it via `supabase status`.
4. `npm run dev`.

### Non-obvious gotchas

- **Use `localhost:3000`, NOT `127.0.0.1:3000`, when testing auth.** The
  `/auth/callback` route builds its post-login redirect from Next.js `request.url`,
  which always resolves to `localhost`. If you sign in on `127.0.0.1`, the session
  cookie is set on `127.0.0.1` but the callback redirects to `localhost`, so the app
  appears logged out. Keep the whole magic-link flow on `localhost`.
- **Magic-link login (no real email needed).** Sign-in emails are captured by
  Mailpit at http://localhost:54324. The sign-in link is **single-use** — open it
  exactly once as a top-level navigation. To automate: read the newest message via
  the Mailpit API (`/api/v1/search?query=to:<email>`, then `/api/v1/message/<id>`)
  and extract the `.../auth/v1/verify?...` URL.
- **`supabase/seed.sql` grants table DML to `anon`/`authenticated`.** Hosted
  Supabase does this automatically; the local CLI stack does not, so without it
  every PostgREST call fails with `42501 permission denied`. It runs automatically
  on `supabase start` / `supabase db reset`. RLS policies still enforce row access.
- **Onboarding (create/join household) is broken under RLS (pre-existing app bug,
  not an env issue).** `onboarding/page.tsx` does `.insert(...).select()` on
  `households`, but the SELECT policy only exposes rows to existing members, so the
  insert+select returns `42501` (same on hosted Supabase). To reach the main app for
  testing, seed a household + `household_members` row for the logged-in user directly
  in Postgres, then load the app.
- **`npm run lint` is not usable as-is.** The repo ships no ESLint config, so
  `next lint` drops into an interactive setup prompt. Type checking runs as part of
  `npm run build`.
