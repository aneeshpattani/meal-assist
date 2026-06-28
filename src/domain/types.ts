export type MealType = "breakfast" | "lunch" | "dinner";

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
  mealTypes: MealType[];
  ingredients: Ingredient[];
  lastCooked?: string;
  nutritionSummary?: Nutrition;
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

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function emptyWeeklyPlan(): WeeklyPlan {
  return Object.fromEntries(DAYS.map((d) => [d, {}])) as WeeklyPlan;
}
