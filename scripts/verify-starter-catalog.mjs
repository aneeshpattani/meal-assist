import fs from "node:fs";
import {
  CSV_PATH,
  MIGRATION_PATH,
  assertCatalogMatches,
  extractCatalogFromSql,
  loadCanonicalDishes,
} from "./lib/starter-catalog.mjs";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
let catalog;
try {
  catalog = extractCatalogFromSql(sql);
} catch (error) {
  fail(error.message);
}

if (!sql.includes("add column if not exists notes text")) {
  fail("Migration is missing dishes.notes column");
}
for (const fn of ["create_household", "join_household", "seed_household_starter_dishes"]) {
  if (!sql.includes(`function public.${fn}`)) fail(`Migration is missing ${fn}()`);
}
if (!sql.includes("drop trigger if exists on_household_created")) {
  fail("Seeding trigger should be dropped, not left active");
}

const sqlStates = {
  not_authenticated: "28000",
  invalid_invite: "P2201",
  already_member: "P2202",
  invalid_name: "P2203",
  invite_unavailable: "P2204",
  seed_failed: "P2205",
};
const householdTs = fs.readFileSync(
  new URL("../src/data/household.ts", import.meta.url),
  "utf8"
);
for (const [name, state] of Object.entries(sqlStates)) {
  if (!sql.includes(`errcode = '${state}'`)) {
    fail(`Migration missing errcode ${state} (${name})`);
  }
  if (!householdTs.includes(`${name}: "${state}"`)) {
    fail(`household.ts missing SQLSTATE ${name}: ${state}`);
  }
}

try {
  const dishes = loadCanonicalDishes();
  assertCatalogMatches(dishes, catalog);
} catch (error) {
  fail(error.message);
}

console.log(`OK: ${catalog.length} dishes match ${CSV_PATH.split("/").slice(-2).join("/")}`);
console.log(
  `Notes: ${catalog.filter((d) => d.notes).length} filled, ${catalog.filter((d) => !d.notes).length} null`
);
