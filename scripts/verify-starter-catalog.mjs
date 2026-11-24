import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(
  root,
  "supabase/migrations/002_household_onboarding.sql"
);
const csvPath = path.join(root, "supabase/seed/cleaned-dishes-v4.csv");
const ALLOWED = new Set(["breakfast", "lunch", "dinner"]);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      field = "";
      if (row.some((v) => v.length > 0)) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    if (row.some((v) => v.length > 0)) rows.push(row);
  }
  return rows;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sql = fs.readFileSync(migrationPath, "utf8");
const match = sql.match(/\$starter_catalog\$\s*([\s\S]*?)\s*\$starter_catalog\$/);
if (!match) fail("Could not find $starter_catalog$ JSON in migration");

let catalog;
try {
  catalog = JSON.parse(match[1]);
} catch (error) {
  fail(`Catalog JSON in migration is invalid: ${error.message}`);
}

if (!Array.isArray(catalog)) fail("Catalog JSON is not an array");
if (catalog.length !== 108) fail(`Expected 108 dishes, got ${catalog.length}`);

const ids = new Set();
for (const dish of catalog) {
  if (!dish || typeof dish !== "object") fail("Catalog row is not an object");
  if (typeof dish.id !== "string" || !dish.id) fail(`Missing dish id: ${JSON.stringify(dish)}`);
  if (ids.has(dish.id)) fail(`Duplicate dish id: ${dish.id}`);
  ids.add(dish.id);
  if (slugify(dish.name) !== dish.id) {
    fail(`Dish id "${dish.id}" does not match slug of name "${dish.name}"`);
  }
  if (!Array.isArray(dish.mealTypes) || dish.mealTypes.length === 0) {
    fail(`Dish ${dish.id} has empty mealTypes`);
  }
  for (const mt of dish.mealTypes) {
    if (!ALLOWED.has(mt)) fail(`Dish ${dish.id} has invalid meal type "${mt}"`);
  }
  if (dish.notes !== null && typeof dish.notes !== "string") {
    fail(`Dish ${dish.id} notes must be string or null`);
  }
  if (typeof dish.notes === "string" && dish.notes.trim() === "") {
    fail(`Dish ${dish.id} has empty notes; expected null`);
  }
  if (!Array.isArray(dish.ingredients) || dish.ingredients.length === 0) {
    fail(`Dish ${dish.id} has no ingredients`);
  }
  for (const ing of dish.ingredients) {
    if (!ing?.id || !ing?.name) fail(`Dish ${dish.id} has malformed ingredient`);
    if (slugify(ing.name) !== ing.id) {
      fail(`Ingredient id "${ing.id}" does not match name "${ing.name}"`);
    }
  }
}

if (!sql.includes("add column if not exists notes text")) {
  fail("Migration is missing dishes.notes column");
}
for (const fn of ["create_household", "join_household", "seed_household_starter_dishes"]) {
  if (!sql.includes(`function public.${fn}`)) fail(`Migration is missing ${fn}()`);
}

const csv = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const rows = parseCsv(csv);
const header = rows[0].map((h) => h.trim());
if (JSON.stringify(header) !== JSON.stringify(["Name", "Meal Tag", "Notes", "Ingredients"])) {
  fail(`Unexpected CSV header: ${JSON.stringify(header)}`);
}

const csvDishes = rows.slice(1).map((cols) => {
  const [name, mealTag, notesRaw, ingredientsRaw] = cols.map((c) => c.trim());
  return {
    id: slugify(name),
    name,
    mealTypes: mealTag
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
    notes: notesRaw.length > 0 ? notesRaw : null,
    ingredients: (ingredientsRaw ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((ingName) => ({ id: slugify(ingName), name: ingName })),
  };
});

if (csvDishes.length !== 108) fail(`CSV has ${csvDishes.length} dishes, expected 108`);

const catalogById = new Map(catalog.map((d) => [d.id, d]));
for (const expected of csvDishes) {
  const actual = catalogById.get(expected.id);
  if (!actual) fail(`Migration catalog missing CSV dish "${expected.name}" (${expected.id})`);
  if (actual.name !== expected.name) {
    fail(`Name mismatch for ${expected.id}: ${actual.name} vs ${expected.name}`);
  }
  if (JSON.stringify(actual.mealTypes) !== JSON.stringify(expected.mealTypes)) {
    fail(`Meal types mismatch for ${expected.id}`);
  }
  if (actual.notes !== expected.notes) {
    fail(`Notes mismatch for ${expected.id}`);
  }
  if (JSON.stringify(actual.ingredients) !== JSON.stringify(expected.ingredients)) {
    fail(`Ingredients mismatch for ${expected.id}`);
  }
}

console.log(`OK: ${catalog.length} dishes match cleaned-dishes-v4.csv`);
console.log(
  `Notes: ${catalog.filter((d) => d.notes).length} filled, ${catalog.filter((d) => !d.notes).length} null`
);
