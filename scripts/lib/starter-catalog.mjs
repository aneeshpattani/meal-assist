import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CATALOG_MARKER = "starter_catalog";
export const ALLOWED_MEAL_TYPES = new Set(["breakfast", "lunch", "dinner"]);

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const MIGRATION_PATH = path.join(
  ROOT,
  "supabase/migrations/002_household_onboarding.sql"
);
export const CSV_PATH = path.join(ROOT, "supabase/seed/cleaned-dishes-v4.csv");

export function parseCsv(text) {
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

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function dishesFromCsv(csvText) {
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ""));
  const header = rows[0].map((h) => h.trim());
  if (JSON.stringify(header) !== JSON.stringify(["Name", "Meal Tag", "Notes", "Ingredients"])) {
    throw new Error(`Unexpected CSV header: ${JSON.stringify(header)}`);
  }
  return rows.slice(1).map((cols) => {
    const [name, mealTag, notesRaw, ingredientsRaw] = cols.map((c) => c.trim());
    const mealTypes = mealTag
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
    for (const mt of mealTypes) {
      if (!ALLOWED_MEAL_TYPES.has(mt)) {
        throw new Error(`Unknown meal tag "${mt}" on "${name}"`);
      }
    }
    return {
      id: slugify(name),
      name,
      mealTypes,
      notes: notesRaw.length > 0 ? notesRaw : null,
      ingredients: (ingredientsRaw ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((ingName) => ({ id: slugify(ingName), name: ingName })),
    };
  });
}

export function extractCatalogFromSql(sql) {
  const match = sql.match(
    new RegExp(`\\$${CATALOG_MARKER}\\$\\s*([\\s\\S]*?)\\s*\\$${CATALOG_MARKER}\\$`)
  );
  if (!match) {
    throw new Error(`Could not find $${CATALOG_MARKER}$ JSON in migration`);
  }
  return JSON.parse(match[1]);
}

export function renderCatalogSql(dishes) {
  const json = JSON.stringify(dishes, null, 2);
  return `$${CATALOG_MARKER}$\n${json}\n$${CATALOG_MARKER}$`;
}

export function replaceCatalogInSql(sql, dishes) {
  const rendered = renderCatalogSql(dishes);
  const next = sql.replace(
    new RegExp(`\\$${CATALOG_MARKER}\\$[\\s\\S]*?\\$${CATALOG_MARKER}\\$`),
    rendered
  );
  if (next === sql) {
    throw new Error("Failed to replace catalog JSON in migration");
  }
  return next;
}

export function assertCatalogMatches(dishes, catalog) {
  if (!Array.isArray(catalog)) throw new Error("Catalog JSON is not an array");
  if (catalog.length !== 108) {
    throw new Error(`Expected 108 dishes, got ${catalog.length}`);
  }
  if (dishes.length !== 108) {
    throw new Error(`CSV has ${dishes.length} dishes, expected 108`);
  }
  const ids = new Set();
  for (const dish of catalog) {
    if (!dish?.id || !dish?.name) throw new Error(`Malformed catalog row: ${JSON.stringify(dish)}`);
    if (ids.has(dish.id)) throw new Error(`Duplicate dish id: ${dish.id}`);
    ids.add(dish.id);
    if (slugify(dish.name) !== dish.id) {
      throw new Error(`Dish id "${dish.id}" does not match slug of "${dish.name}"`);
    }
    if (!Array.isArray(dish.mealTypes) || dish.mealTypes.length === 0) {
      throw new Error(`Dish ${dish.id} has empty mealTypes`);
    }
    for (const mt of dish.mealTypes) {
      if (!ALLOWED_MEAL_TYPES.has(mt)) {
        throw new Error(`Dish ${dish.id} has invalid meal type "${mt}"`);
      }
    }
    if (dish.notes !== null && typeof dish.notes !== "string") {
      throw new Error(`Dish ${dish.id} notes must be string or null`);
    }
    if (typeof dish.notes === "string" && dish.notes.trim() === "") {
      throw new Error(`Dish ${dish.id} has empty notes; expected null`);
    }
    if (!Array.isArray(dish.ingredients) || dish.ingredients.length === 0) {
      throw new Error(`Dish ${dish.id} has no ingredients`);
    }
    for (const ing of dish.ingredients) {
      if (!ing?.id || !ing?.name) {
        throw new Error(`Dish ${dish.id} has a malformed ingredient`);
      }
      if (slugify(ing.name) !== ing.id) {
        throw new Error(`Ingredient id "${ing.id}" does not match name "${ing.name}"`);
      }
    }
  }
  const catalogById = new Map(catalog.map((d) => [d.id, d]));
  for (const expected of dishes) {
    const actual = catalogById.get(expected.id);
    if (!actual) {
      throw new Error(`Migration catalog missing CSV dish "${expected.name}" (${expected.id})`);
    }
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Catalog drift for ${expected.id}`);
    }
  }
}

export function loadCanonicalDishes() {
  return dishesFromCsv(fs.readFileSync(CSV_PATH, "utf8"));
}
