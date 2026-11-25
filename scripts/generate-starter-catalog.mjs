#!/usr/bin/env node
/**
 * Sync supabase/migrations/002_household_onboarding.sql with
 * supabase/seed/cleaned-dishes-v4.csv.
 *
 *   node scripts/generate-starter-catalog.mjs          # rewrite the SQL catalog JSON
 *   node scripts/generate-starter-catalog.mjs --check   # exit 1 if CSV and SQL drifted
 */
import fs from "node:fs";
import {
  CSV_PATH,
  MIGRATION_PATH,
  assertCatalogMatches,
  extractCatalogFromSql,
  loadCanonicalDishes,
  replaceCatalogInSql,
} from "./lib/starter-catalog.mjs";

const checkOnly = process.argv.includes("--check");
const dishes = loadCanonicalDishes();
const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
const catalog = extractCatalogFromSql(sql);

if (checkOnly) {
  assertCatalogMatches(dishes, catalog);
  console.log(`OK: ${catalog.length} dishes in 002 match ${pathBasename(CSV_PATH)}`);
  process.exit(0);
}

assertCatalogMatches(dishes, dishes);
const next = replaceCatalogInSql(sql, dishes);
fs.writeFileSync(MIGRATION_PATH, next);
assertCatalogMatches(dishes, extractCatalogFromSql(next));
console.log(`Wrote ${dishes.length} dishes into ${pathBasename(MIGRATION_PATH)}`);

function pathBasename(filePath) {
  return filePath.split("/").slice(-2).join("/");
}
