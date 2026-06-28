import { Dish, WeeklyPlan, DayPlan, emptyWeeklyPlan, DAYS, MEAL_TYPES } from "@/domain/types";
import { DishRepository, PlanRepository } from "@/data/repository";

const DISHES_KEY = "meal-assist:dishes";
const PLAN_KEY = "meal-assist:plan";

const SEED_DISHES: Dish[] = [
  {
    id: "poha",
    name: "Poha",
    mealTypes: ["breakfast"],
    ingredients: [
      { id: "poha", name: "Poha" },
      { id: "onion", name: "Onion" },
      { id: "peanuts", name: "Peanuts" },
      { id: "green-chilli", name: "Green Chilli" },
      { id: "curry-leaves", name: "Curry Leaves" },
    ],
  },
  {
    id: "chicken-curry",
    name: "Chicken Curry",
    mealTypes: ["lunch", "dinner"],
    ingredients: [
      { id: "chicken", name: "Chicken" },
      { id: "onion", name: "Onion" },
      { id: "tomato", name: "Tomato" },
      { id: "garlic", name: "Garlic" },
      { id: "ginger", name: "Ginger" },
    ],
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function seedIfEmpty(): void {
  if (!isBrowser()) return;
  if (!localStorage.getItem(DISHES_KEY)) {
    writeJSON(DISHES_KEY, SEED_DISHES);
  }
}

function normalizePlan(raw: unknown): WeeklyPlan {
  const base = emptyWeeklyPlan();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const day of DAYS) {
    const dayData = obj[day];
    if (!dayData || typeof dayData !== "object") continue;
    const dayObj = dayData as Record<string, unknown>;
    for (const meal of MEAL_TYPES) {
      const ids = dayObj[meal];
      if (Array.isArray(ids)) {
        (base[day] as DayPlan)[meal] = ids.filter((v) => typeof v === "string");
      }
    }
  }
  return base;
}

function stripDishFromPlan(dishId: string): void {
  if (!isBrowser()) return;
  const raw = localStorage.getItem(PLAN_KEY);
  if (!raw) return;
  let changed = false;
  const plan = normalizePlan(JSON.parse(raw));
  for (const day of DAYS) {
    for (const meal of MEAL_TYPES) {
      const ids = plan[day][meal];
      if (ids && ids.includes(dishId)) {
        plan[day][meal] = ids.filter((id) => id !== dishId);
        changed = true;
      }
    }
  }
  if (changed) writeJSON(PLAN_KEY, plan);
}

export function createLocalDishRepo(): DishRepository {
  seedIfEmpty();

  return {
    async getAll(): Promise<Dish[]> {
      return readJSON<Dish[]>(DISHES_KEY, []);
    },

    async getById(id: string): Promise<Dish | undefined> {
      const all = readJSON<Dish[]>(DISHES_KEY, []);
      return all.find((d) => d.id === id);
    },

    async save(dish: Dish): Promise<void> {
      const all = readJSON<Dish[]>(DISHES_KEY, []);
      const idx = all.findIndex((d) => d.id === dish.id);
      if (idx >= 0) {
        all[idx] = dish;
      } else {
        all.push(dish);
      }
      writeJSON(DISHES_KEY, all);
    },

    async remove(id: string): Promise<void> {
      const all = readJSON<Dish[]>(DISHES_KEY, []);
      writeJSON(DISHES_KEY, all.filter((d) => d.id !== id));
      stripDishFromPlan(id);
    },
  };
}

export function createLocalPlanRepo(): PlanRepository {
  return {
    async get(): Promise<WeeklyPlan> {
      if (!isBrowser()) return emptyWeeklyPlan();
      try {
        const raw = localStorage.getItem(PLAN_KEY);
        return raw ? normalizePlan(JSON.parse(raw)) : emptyWeeklyPlan();
      } catch {
        return emptyWeeklyPlan();
      }
    },

    async save(plan: WeeklyPlan): Promise<void> {
      writeJSON(PLAN_KEY, plan);
    },
  };
}
