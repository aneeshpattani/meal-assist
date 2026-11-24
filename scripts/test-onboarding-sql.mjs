import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
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

const userA = "11111111-1111-1111-1111-111111111111";
const userB = "22222222-2222-2222-2222-222222222222";
const userC = "33333333-3333-3333-3333-333333333333";
await db.query("insert into auth.users (id) values ($1), ($2), ($3)", [
  userA,
  userB,
  userC,
]);

await db.query("select set_config('test.user_id', $1, false)", [userA]);
const created = await db.query("select public.create_household($1) as household", [
  "Aneesh Home",
]);
const household = created.rows[0].household;
if (!household?.id || !household?.invite_code) {
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
if (
  JSON.stringify(alooGobi.meal_types) !==
  JSON.stringify(["breakfast", "lunch", "dinner"])
) {
  fail(`Aloo Gobi meal_types ${JSON.stringify(alooGobi.meal_types)}`);
}
const ingredientNames = alooGobi.ingredients.map((i) => i.name);
if (!ingredientNames.includes("Potato") || !ingredientNames.includes("Cauliflower")) {
  fail(`Aloo Gobi ingredients ${JSON.stringify(alooGobi.ingredients)}`);
}

const notesCol = await db.query(
  `select is_nullable from information_schema.columns
   where table_schema = 'public' and table_name = 'dishes' and column_name = 'notes'`
);
if (notesCol.rows[0]?.is_nullable !== "YES") fail("dishes.notes is not nullable text");

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

await db.query("select set_config('test.user_id', $1, false)", [userB]);
const joined = await db.query("select public.join_household($1) as household", [
  household.invite_code,
]);
if (joined.rows[0].household.id !== household.id) {
  fail("join_household did not return the invited household");
}

const sameJoin = await db.query("select public.join_household($1) as household", [
  String(household.invite_code).toLowerCase(),
]);
if (sameJoin.rows[0].household.id !== household.id) {
  fail("join_household was not idempotent");
}

try {
  await db.query("select public.join_household($1)", ["NOPE12"]);
  fail("join_household accepted an invalid code");
} catch (error) {
  if (!/invalid invite code/i.test(error.message)) {
    fail(`Unexpected invalid-code error: ${error.message}`);
  }
}

await db.query("select set_config('test.user_id', $1, false)", [userC]);
await db.query("select public.create_household($1)", ["Other Home"]);
try {
  await db.query("select public.join_household($1)", [household.invite_code]);
  fail("join_household allowed switching households");
} catch (error) {
  if (!/already a member of a household/i.test(error.message)) {
    fail(`Unexpected already-member error: ${error.message}`);
  }
}

await db.query("select set_config('test.user_id', '', false)");
try {
  await db.query("select public.create_household($1)", ["Nope"]);
  fail("create_household allowed an unauthenticated caller");
} catch (error) {
  if (!/not authenticated/i.test(error.message)) {
    fail(`Unexpected unauthenticated error: ${error.message}`);
  }
}

const plans = await db.query(
  "select count(*)::int as n from public.weekly_plans where household_id = $1",
  [household.id]
);
if (plans.rows[0].n !== 1) fail("Expected one weekly plan for the new household");

console.log("OK: onboarding SQL");
console.log(`  household ${household.id} invite ${household.invite_code}`);
console.log("  108 dishes seeded, notes persisted, create/join RPCs checked");
