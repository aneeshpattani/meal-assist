import { Dish, Ingredient } from "./types";

/**
 * Consolidate ingredients across dishes, merging duplicates by id.
 * Quantities are summed when both entries share the same unit.
 */
export function generateGroceryList(dishes: Dish[]): Ingredient[] {
  const map = new Map<string, Ingredient>();

  for (const dish of dishes) {
    for (const ing of dish.ingredients) {
      const existing = map.get(ing.id);
      if (existing) {
        if (
          existing.quantity !== undefined &&
          ing.quantity !== undefined &&
          existing.unit === ing.unit
        ) {
          existing.quantity += ing.quantity;
        }
      } else {
        map.set(ing.id, { ...ing });
      }
    }
  }

  return Array.from(map.values());
}
