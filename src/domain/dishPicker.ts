import type { Dish, DishTag } from "./types";

export const DISH_NAME_MAX_LENGTH = 80;

/** Trim and collapse internal whitespace for matching and new dish names. */
export function normalizeDishName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Case-insensitive, whitespace-normalized key for exact dish-name matching. */
export function dishNameKey(name: string): string {
  return normalizeDishName(name).toLowerCase();
}

export function hasExactDishNameMatch(
  dishes: readonly { name: string }[],
  query: string
): boolean {
  const key = dishNameKey(query);
  if (key.length === 0) return false;
  return dishes.some((dish) => dishNameKey(dish.name) === key);
}

export function shouldShowCreateRow(
  dishes: readonly { name: string }[],
  query: string
): boolean {
  const normalized = normalizeDishName(query);
  if (normalized.length === 0 || normalized.length > DISH_NAME_MAX_LENGTH) {
    return false;
  }
  return !hasExactDishNameMatch(dishes, query);
}

export function validateDishName(name: string): string | null {
  const normalized = normalizeDishName(name);
  if (normalized.length === 0) return "Enter a dish name.";
  if (normalized.length > DISH_NAME_MAX_LENGTH) {
    return `Dish names can be at most ${DISH_NAME_MAX_LENGTH} characters.`;
  }
  return null;
}

/** Append a meal tag without replacing or reordering existing tags. */
export function appendMealTag(
  mealTypes: readonly DishTag[],
  tag: DishTag
): DishTag[] {
  if (mealTypes.includes(tag)) return [...mealTypes];
  return [...mealTypes, tag];
}

export function dishNeedsDetails(dish: {
  ingredients: readonly unknown[];
}): boolean {
  return dish.ingredients.length === 0;
}

export function generateDishId(name: string): string {
  const slug = dishNameKey(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const base = slug.length > 0 ? slug : "dish";
  return `${base}-${Date.now().toString(36)}`;
}

export function buildInlineDish(name: string, tag: DishTag): Dish {
  const normalized = normalizeDishName(name);
  return {
    id: generateDishId(normalized),
    name: normalized,
    mealTypes: [tag],
    ingredients: [],
  };
}

export function filterDishesForPicker<
  T extends { id: string; name: string; mealTypes: readonly DishTag[] },
>(
  dishes: readonly T[],
  query: string,
  tag: DishTag,
  selectedIds: readonly string[]
): T[] {
  const key = dishNameKey(query);
  const filtered = key
    ? dishes.filter((dish) => dishNameKey(dish.name).includes(key))
    : [...dishes];
  const selected = new Set(selectedIds);

  return filtered.sort((a, b) => {
    const aSelected = selected.has(a.id) ? 0 : 1;
    const bSelected = selected.has(b.id) ? 0 : 1;
    if (aSelected !== bSelected) return aSelected - bSelected;

    const aTag = a.mealTypes.includes(tag) ? 0 : 1;
    const bTag = b.mealTypes.includes(tag) ? 0 : 1;
    if (aTag !== bTag) return aTag - bTag;

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
