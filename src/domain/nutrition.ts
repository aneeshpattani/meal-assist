import { Dish, Nutrition, WeeklyPlan, DAYS, MEAL_TYPES } from "./types";

const NUTRITION_KEYS: (keyof Nutrition)[] = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "vitaminA",
  "vitaminB12",
  "vitaminC",
  "vitaminD",
  "vitaminE",
  "calcium",
  "iron",
  "magnesium",
  "potassium",
];

function sumNutrition(items: Nutrition[]): Nutrition {
  const result: Nutrition = {};
  for (const item of items) {
    for (const key of NUTRITION_KEYS) {
      if (item[key] !== undefined) {
        result[key] = (result[key] ?? 0) + item[key]!;
      }
    }
  }
  return result;
}

/** Sum ingredient-level nutrition into a dish-level summary. */
export function summarizeDish(dish: Dish): Nutrition {
  const ingredientNutrition = dish.ingredients
    .map((i) => i.nutrition)
    .filter((n): n is Nutrition => n !== undefined);
  return sumNutrition(ingredientNutrition);
}

/** Aggregate nutrition across every dish in the weekly plan. */
export function weeklyNutritionSummary(
  plan: WeeklyPlan,
  dishLookup: (id: string) => Dish | undefined
): Nutrition {
  const all: Nutrition[] = [];
  for (const day of DAYS) {
    for (const meal of MEAL_TYPES) {
      const ids = plan[day][meal] ?? [];
      for (const id of ids) {
        const dish = dishLookup(id);
        if (dish?.nutritionSummary) {
          all.push(dish.nutritionSummary);
        }
      }
    }
  }
  return sumNutrition(all);
}

type VitaminStatus = "sufficient" | "warning" | "unknown";

export type VitaminCoverageResult = {
  vitaminA: VitaminStatus;
  vitaminB12: VitaminStatus;
  vitaminC: VitaminStatus;
  vitaminD: VitaminStatus;
  vitaminE: VitaminStatus;
  calcium: VitaminStatus;
  iron: VitaminStatus;
};

/**
 * Placeholder: returns "unknown" for all vitamins until
 * real RDA thresholds and ingredient nutrition data are added.
 */
export function vitaminCoverage(
  _weeklyNutrition: Nutrition
): VitaminCoverageResult {
  return {
    vitaminA: "unknown",
    vitaminB12: "unknown",
    vitaminC: "unknown",
    vitaminD: "unknown",
    vitaminE: "unknown",
    calcium: "unknown",
    iron: "unknown",
  };
}
