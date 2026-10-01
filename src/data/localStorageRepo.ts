import { Dish, WeeklyPlan, emptyWeeklyPlan } from "@/domain/types";
import { normalizePlan, stripDishFromPlan } from "@/domain/plan";
import { DishRepository, PlanRepository } from "@/data/repository";

const DISHES_KEY = "meal-assist:dishes";
const PLAN_KEY = "meal-assist:plan";

const SEED_DISHES: Dish[] = [
  {
    id: "poha",
    name: "Poha",
    mealTypes: ["breakfast"],
    subtitle: "Maharashtrian",
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
      writeJSON(
        DISHES_KEY,
        all.filter((d) => d.id !== id)
      );
      if (!isBrowser()) return;
      const raw = localStorage.getItem(PLAN_KEY);
      if (!raw) return;
      writeJSON(PLAN_KEY, stripDishFromPlan(normalizePlan(JSON.parse(raw)), id));
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
