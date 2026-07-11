-- Local-only seed for the Supabase CLI stack.
--
-- Hosted Supabase automatically grants table/sequence DML privileges to the
-- `anon` and `authenticated` roles (via ALTER DEFAULT PRIVILEGES). The local
-- CLI stack does not, so tables created by migrations are unreachable through
-- PostgREST (every request 42501s with "permission denied for table ...")
-- even though the RLS policies in the migration are correct.
--
-- These grants only re-create that hosted default so the app works locally.
-- Row-level security policies from the migration still enforce access control.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
