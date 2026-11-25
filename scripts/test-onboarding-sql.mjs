import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INVITE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function sqlState(error) {
  return error?.code || error?.fields?.code || "";
}

async function expectError(fn, expectedCode, label) {
  try {
    await fn();
    fail(`${label}: expected SQLSTATE ${expectedCode}`);
  } catch (error) {
    const code = sqlState(error);
    const message = String(error?.message ?? error);
    if (code !== expectedCode && !message.includes(expectedCode)) {
      fail(
        `${label}: expected SQLSTATE ${expectedCode}, got ${code || "?"} (${message})`
      );
    }
  }
}

const db = new PGlite();

const bootstrap = `
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

grant usage on schema public to anon, authenticated;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('test.user_id', true), '')::uuid;
$$;
`;

const migration1 = fs.readFileSync(
  path.join(root, "supabase/migrations/001_initial_schema.sql"),
  "utf8"
);
const migration2 = fs.readFileSync(
  path.join(root, "supabase/migrations/002_household_onboarding.sql"),
  "utf8"
);

await db.exec(bootstrap);
await db.exec(migration1);
await db.exec(migration2);
// Idempotent: re-applying 002 on an already-migrated DB must succeed.
await db.exec(migration2);

const userA = "11111111-1111-1111-1111-111111111111";
const userB = "22222222-2222-2222-2222-222222222222";
const userC = "33333333-3333-3333-3333-333333333333";
const userD = "44444444-4444-4444-4444-444444444444";
await db.query("insert into auth.users (id) values ($1), ($2), ($3), ($4)", [
  userA,
  userB,
  userC,
  userD,
]);

await db.query("select set_config('test.user_id', $1, false)", [userA]);
const created = await db.query("select public.create_household($1) as household", [
  "Aneesh Home",
]);
const household = created.rows[0].household;
if (!household?.id || !INVITE_RE.test(household.invite_code)) {
  fail(`create_household returned ${JSON.stringify(household)}`);
}

const dishes = await db.query(
  "select id, name, meal_types, notes, ingredients from public.dishes where household_id = $1 order by name",
  [household.id]
);
if (dishes.rows.length !== 108) {
  fail(`Expected 108 seeded dishes, got ${dishes.rows.length}`);
}

const poha = dishes.rows.find((d) => d.id === "poha");
if (!poha) fail("Missing seeded dish poha");
if (poha.notes !== null) fail("Poha notes should be null");
if (JSON.stringify(poha.meal_types) !== JSON.stringify(["breakfast"])) {
  fail(`Poha meal_types ${JSON.stringify(poha.meal_types)}`);
}

const alooGobi = dishes.rows.find((d) => d.id === "aloo-gobi");
if (!alooGobi) fail("Missing seeded dish aloo-gobi");
if (alooGobi.notes !== "Often eaten with chappathi for any meal") {
  fail(`Aloo Gobi notes: ${alooGobi.notes}`);
}

await db.query("select public.seed_household_starter_dishes($1)", [household.id]);
const afterReseed = await db.query(
  "select count(*)::int as n from public.dishes where household_id = $1",
  [household.id]
);
if (afterReseed.rows[0].n !== 108) {
  fail(`Reseed changed dish count to ${afterReseed.rows[0].n}`);
}

const again = await db.query("select public.create_household($1) as household", [
  "Should Not Create",
]);
if (again.rows[0].household.id !== household.id) {
  fail("create_household was not idempotent for an existing member");
}

const householdsAfterIdempotent = await db.query(
  "select count(*)::int as n from public.households"
);
if (householdsAfterIdempotent.rows[0].n !== 1) {
  fail("Idempotent create_household inserted another household");
}

await db.query("select set_config('test.user_id', $1, false)", [userB]);
const joined = await db.query("select public.join_household($1) as household", [
  household.invite_code,
]);
if (joined.rows[0].household.id !== household.id) {
  fail("join_household did not return the invited household");
}

const sameJoin = await db.query("select public.join_household($1) as household", [
  `  ${String(household.invite_code).toLowerCase()}  `,
]);
if (sameJoin.rows[0].household.id !== household.id) {
  fail("join_household did not accept trimmed/lowercased valid codes");
}

const invalidCodes = [
  "",
  "   ",
  "NOPE12",
  "ABCD234",
  "ABCD23456",
  "ABCD234O",
  "ABCD2340",
  "ABCD234I",
  "ABCD2341",
  "ABCD2345😀",
  "ＡＢＣＤ２３４５",
];
for (const code of invalidCodes) {
  await expectError(
    () => db.query("select public.join_household($1)", [code]),
    "P2201",
    `invalid invite ${JSON.stringify(code)}`
  );
}

await db.query("select set_config('test.user_id', $1, false)", [userC]);
await expectError(
  () => db.query("select public.create_household($1)", [""]),
  "P2203",
  "blank household name"
);
await expectError(
  () => db.query("select public.create_household($1)", ["   "]),
  "P2203",
  "whitespace household name"
);
await expectError(
  () => db.query("select public.create_household($1)", ["H".repeat(81)]),
  "P2203",
  "overlong household name"
);

const maxName = await db.query("select public.create_household($1) as household", [
  "H".repeat(80),
]);
if (!maxName.rows[0].household?.id) fail("80-character household name should be accepted");

try {
  await db.query("select public.join_household($1)", [household.invite_code]);
  fail("join_household allowed switching households");
} catch (error) {
  if (sqlState(error) !== "P2202") {
    fail(`already-member: expected P2202, got ${sqlState(error)} ${error.message}`);
  }
}

await db.query("select set_config('test.user_id', '', false)");
await expectError(
  () => db.query("select public.create_household($1)", ["Nope"]),
  "28000",
  "unauthenticated create"
);
await expectError(
  () => db.query("select public.join_household($1)", [household.invite_code]),
  "28000",
  "unauthenticated join"
);

const triggerGone = await db.query(`
  select count(*)::int as n
  from pg_trigger
  where tgname = 'on_household_created'
`);
if (triggerGone.rows[0].n !== 0) fail("on_household_created trigger should be dropped");

const rawInsert = await db.query(`
  insert into public.households (name, invite_code)
  values ('Raw Insert', 'ZZZZZZZZ')
  returning id
`);
const rawDishes = await db.query(
  "select count(*)::int as n from public.dishes where household_id = $1",
  [rawInsert.rows[0].id]
);
if (rawDishes.rows[0].n !== 0) {
  fail("Raw households INSERT should not seed dishes");
}

await db.query("select set_config('test.user_id', $1, false)", [userD]);
const second = await db.query("select public.create_household($1) as household", [
  "Second Home",
]);
try {
  await db.query(
    "insert into public.household_members (household_id, user_id) values ($1, $2)",
    [household.id, userD]
  );
  fail("unique user_id constraint did not block a second membership");
} catch (error) {
  const msg = String(error.message ?? "");
  if (!/unique|duplicate/i.test(msg) && sqlState(error) !== "23505") {
    fail(`expected unique_violation, got ${sqlState(error)} ${msg}`);
  }
}

const privs = await db.query(`
  select
    has_function_privilege('anon', 'public.create_household(text)', 'execute') as anon_create,
    has_function_privilege('anon', 'public.join_household(text)', 'execute') as anon_join,
    has_function_privilege('anon', 'public.seed_household_starter_dishes(uuid)', 'execute') as anon_seed,
    has_function_privilege('anon', 'public.generate_invite_code()', 'execute') as anon_gen,
    has_function_privilege('authenticated', 'public.create_household(text)', 'execute') as auth_create,
    has_function_privilege('authenticated', 'public.join_household(text)', 'execute') as auth_join,
    has_function_privilege('authenticated', 'public.seed_household_starter_dishes(uuid)', 'execute') as auth_seed,
    has_table_privilege('anon', 'public.starter_dishes', 'select') as anon_select,
    has_table_privilege('anon', 'public.starter_dishes', 'insert') as anon_insert,
    has_table_privilege('authenticated', 'public.starter_dishes', 'select') as auth_select,
    has_table_privilege('authenticated', 'public.starter_dishes', 'insert') as auth_insert,
    has_table_privilege('authenticated', 'public.starter_dishes', 'update') as auth_update,
    has_table_privilege('authenticated', 'public.starter_dishes', 'delete') as auth_delete
`);
const p = privs.rows[0];
for (const key of [
  "anon_create",
  "anon_join",
  "anon_seed",
  "anon_gen",
  "auth_seed",
  "anon_select",
  "anon_insert",
  "auth_select",
  "auth_insert",
  "auth_update",
  "auth_delete",
]) {
  if (p[key]) fail(`privilege ${key} should be false`);
}
if (!p.auth_create || !p.auth_join) {
  fail("authenticated should be able to execute create_household and join_household");
}

async function assertRoleBlocked(role, sql, label) {
  await db.exec("start transaction");
  try {
    await db.exec(`set local role ${role}`);
    try {
      await db.query(sql);
      fail(`${label}: ${role} should be denied`);
    } catch (error) {
      const msg = String(error.message ?? "");
      if (!/permission denied|not granted|row-level security/i.test(msg)) {
        fail(`${label}: unexpected ${role} error: ${msg}`);
      }
    }
  } finally {
    await db.exec("rollback");
  }
}

await assertRoleBlocked(
  "anon",
  "select * from public.starter_dishes",
  "anon select starter_dishes"
);
await assertRoleBlocked(
  "authenticated",
  "select * from public.starter_dishes",
  "authenticated select starter_dishes"
);
await assertRoleBlocked(
  "anon",
  "select public.create_household('Nope')",
  "anon execute create_household"
);
await assertRoleBlocked(
  "authenticated",
  "insert into public.starter_dishes (id, name, meal_types, notes, ingredients) values ('x','X',array['breakfast']::text[],null,'[]'::jsonb)",
  "authenticated insert starter_dishes"
);

await db.exec("start transaction");
await db.exec("set local role authenticated");
await db.query("select set_config('test.user_id', $1, false)", [userA]);
const asAuth = await db.query("select public.create_household($1) as household", [
  "Ignored",
]);
if (asAuth.rows[0].household.id !== household.id) {
  fail("authenticated role could not execute create_household via GRANT");
}
await db.exec("rollback");

const uniqueIdx = await db.query(`
  select indexdef from pg_indexes
  where tablename = 'household_members' and indexname = 'household_members_user_id_uidx'
`);
if (!uniqueIdx.rows[0]?.indexdef) {
  fail("missing unique index household_members_user_id_uidx");
}

const rls = await db.query(`
  select c.relrowsecurity, c.relforcerowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'starter_dishes'
`);
if (!rls.rows[0]?.relrowsecurity || !rls.rows[0]?.relforcerowsecurity) {
  fail("starter_dishes must have RLS enabled and forced");
}

const policies = await db.query(`
  select count(*)::int as n from pg_policies
  where schemaname = 'public' and tablename = 'starter_dishes'
`);
if (policies.rows[0].n !== 0) {
  fail("starter_dishes must have zero RLS policies");
}

const plans = await db.query(
  "select count(*)::int as n from public.weekly_plans where household_id = $1",
  [household.id]
);
if (plans.rows[0].n !== 1) fail("Expected one weekly plan for the new household");

console.log("OK: onboarding SQL");
console.log(`  household ${household.id} invite ${household.invite_code}`);
console.log("  108 dishes, RLS/grants, invite validation, unique membership");
