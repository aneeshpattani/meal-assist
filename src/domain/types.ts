export type MealType = "breakfast" | "lunch" | "dinner" | "tea";

export type DishTag = MealType | "snack";

export type Nutrition = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  vitaminA?: number;
  vitaminB12?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  potassium?: number;
};

export type Ingredient = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  nutrition?: Nutrition;
};

export type Dish = {
  id: string;
  name: string;
  mealTypes: DishTag[];
  ingredients: Ingredient[];
  lastCooked?: string;
  nutritionSummary?: Nutrition;
  subtitle?: string;
};

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayPlan = {
  [K in MealType]?: string[];
} & {
  snacks?: Partial<Record<MealType, string[]>>;
};

export type WeeklyPlan = {
  [K in DayOfWeek]: DayPlan;
};

export const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "tea"];

export const DISH_TAGS: DishTag[] = [
  "breakfast",
  "lunch",
  "dinner",
  "tea",
  "snack",
];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  tea: "Evening tea",
};

export const MEAL_LABELS_UPPER: Record<MealType, string> = {
  breakfast: "BREAKFAST",
  lunch: "LUNCH",
  dinner: "DINNER",
  tea: "EVENING TEA",
};

export const MEAL_SHORT: Record<MealType, string> = {
  breakfast: "B",
  lunch: "L",
  dinner: "D",
  tea: "T",
};

export const DISH_TAG_LABELS: Record<DishTag, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  tea: "Tea",
  snack: "Snack",
};

export const DAY_LETTERS: Record<DayOfWeek, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "T",
  friday: "F",
  saturday: "S",
  sunday: "S",
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function emptyWeeklyPlan(): WeeklyPlan {
  return Object.fromEntries(DAYS.map((d) => [d, {}])) as WeeklyPlan;
}

export function dishSubtitle(dish: Dish): string {
  if (dish.subtitle?.trim()) return dish.subtitle.trim();
  if (dish.ingredients.length > 0) {
    return dish.ingredients
      .map((i) => i.name)
      .slice(0, 2)
      .join(" · ");
  }
  return DISH_TAG_LABELS[dish.mealTypes[0] ?? "breakfast"];
}
