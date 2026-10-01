import {
  DayOfWeek,
  DayPlan,
  DAYS,
  DAY_SHORT,
  Dish,
  MEAL_LABELS,
  MEAL_SHORT,
  MEAL_TYPES,
  MealType,
  WeeklyPlan,
  emptyWeeklyPlan,
} from "./types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dateForDay(monday: Date, day: DayOfWeek): Date {
  return addDays(monday, DAYS.indexOf(day));
}

export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()}–${sunday.getDate()} ${MONTHS[monday.getMonth()]}`;
  }
  return `${monday.getDate()} ${MONTHS[monday.getMonth()]}–${sunday.getDate()} ${MONTHS[sunday.getMonth()]}`;
}

export function formatDayShort(date: Date): string {
  return `${DAY_SHORT[DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]]} ${date.getDate()}`;
}

export function formatCollapsedDay(monday: Date, day: DayOfWeek): string {
  const date = dateForDay(monday, day);
  return `${DAY_SHORT[day]} ${date.getDate()}`;
}

export function formatShareSubtitle(monday: Date, day: DayOfWeek): string {
  const date = dateForDay(monday, day);
  return `${DAY_SHORT[day]}day · ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function todayDayOfWeek(now = new Date()): DayOfWeek {
  return DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
}

export function mealIds(dayPlan: DayPlan, meal: MealType): string[] {
  return dayPlan[meal] ?? [];
}

export function snackIds(dayPlan: DayPlan, meal: MealType): string[] {
  return dayPlan.snacks?.[meal] ?? [];
}

export function isMealFilled(dayPlan: DayPlan, meal: MealType): boolean {
  return mealIds(dayPlan, meal).length > 0 || snackIds(dayPlan, meal).length > 0;
}

export function filledSlotCount(dayPlan: DayPlan): number {
  return MEAL_TYPES.filter((meal) => isMealFilled(dayPlan, meal)).length;
}

export function weekHasMeals(plan: WeeklyPlan): boolean {
  return DAYS.some((day) => filledSlotCount(plan[day]) > 0);
}

export function slotSummary(count: number): string {
  if (count === 0) return "Empty";
  return count === 1 ? "1 slot" : `${count} slots`;
}

export function dishName(dishes: Dish[], id: string): string {
  return dishes.find((d) => d.id === id)?.name ?? id;
}

export function normalizeDayPlan(raw: unknown): DayPlan {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const day: DayPlan = {};
  for (const meal of MEAL_TYPES) {
    const ids = obj[meal];
    if (Array.isArray(ids)) {
      day[meal] = ids.filter((v): v is string => typeof v === "string");
    }
  }
  if (obj.snacks && typeof obj.snacks === "object") {
    const snacks: Partial<Record<MealType, string[]>> = {};
    const rawSnacks = obj.snacks as Record<string, unknown>;
    for (const meal of MEAL_TYPES) {
      const ids = rawSnacks[meal];
      if (Array.isArray(ids)) {
        snacks[meal] = ids.filter((v): v is string => typeof v === "string");
      }
    }
    if (Object.keys(snacks).length > 0) {
      day.snacks = snacks;
    }
  }
  return day;
}

export function normalizePlan(raw: unknown): WeeklyPlan {
  const base = emptyWeeklyPlan();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const day of DAYS) {
    base[day] = normalizeDayPlan(obj[day]);
  }
  return base;
}

export function stripDishFromPlan(plan: WeeklyPlan, dishId: string): WeeklyPlan {
  const next = emptyWeeklyPlan();
  for (const day of DAYS) {
    const dayPlan: DayPlan = {};
    for (const meal of MEAL_TYPES) {
      const ids = (plan[day][meal] ?? []).filter((id) => id !== dishId);
      if (ids.length) dayPlan[meal] = ids;
    }
    const snacks: Partial<Record<MealType, string[]>> = {};
    for (const meal of MEAL_TYPES) {
      const ids = (plan[day].snacks?.[meal] ?? []).filter((id) => id !== dishId);
      if (ids.length) snacks[meal] = ids;
    }
    if (Object.keys(snacks).length) dayPlan.snacks = snacks;
    next[day] = dayPlan;
  }
  return next;
}

export function addDishToMeal(
  plan: WeeklyPlan,
  day: DayOfWeek,
  meal: MealType,
  dishId: string,
  replaceId?: string
): WeeklyPlan {
  const updated = { ...plan, [day]: { ...plan[day] } };
  const current = [...(updated[day][meal] ?? [])];
  const without = replaceId ? current.filter((id) => id !== replaceId) : current;
  if (!without.includes(dishId)) without.push(dishId);
  updated[day][meal] = without;
  return updated;
}

export function removeDishFromMeal(
  plan: WeeklyPlan,
  day: DayOfWeek,
  meal: MealType,
  dishId: string
): WeeklyPlan {
  const updated = { ...plan, [day]: { ...plan[day] } };
  updated[day][meal] = (updated[day][meal] ?? []).filter((id) => id !== dishId);
  return updated;
}

export function setSnackOnMeal(
  plan: WeeklyPlan,
  day: DayOfWeek,
  meal: MealType,
  dishId: string
): WeeklyPlan {
  const updated = { ...plan, [day]: { ...plan[day] } };
  const snacks = { ...(updated[day].snacks ?? {}) };
  const current = [...(snacks[meal] ?? [])];
  if (!current.includes(dishId)) current.push(dishId);
  snacks[meal] = current;
  updated[day].snacks = snacks;
  return updated;
}

export function removeSnackFromMeal(
  plan: WeeklyPlan,
  day: DayOfWeek,
  meal: MealType,
  dishId: string
): WeeklyPlan {
  const updated = { ...plan, [day]: { ...plan[day] } };
  const snacks = { ...(updated[day].snacks ?? {}) };
  snacks[meal] = (snacks[meal] ?? []).filter((id) => id !== dishId);
  if ((snacks[meal] ?? []).length === 0) delete snacks[meal];
  updated[day].snacks = Object.keys(snacks).length ? snacks : undefined;
  return updated;
}

export function cookListLines(
  plan: WeeklyPlan,
  dishes: Dish[],
  day: DayOfWeek,
  monday: Date
): string[] {
  const date = dateForDay(monday, day);
  const dayPlan = plan[day];
  const lines = [
    `${DAY_SHORT[day]}day cook list · ${date.getDate()} ${MONTHS[date.getMonth()]}`,
    "",
  ];
  for (const meal of MEAL_TYPES) {
    const mains = mealIds(dayPlan, meal).map((id) => dishName(dishes, id));
    const snacks = snackIds(dayPlan, meal).map((id) => dishName(dishes, id));
    const items = [...mains, ...snacks];
    lines.push(`${MEAL_SHORT[meal]} ${MEAL_LABELS[meal]}`);
    lines.push(items.length ? `  ${items.join(" · ")}` : "  —");
  }
  return lines;
}

export function cookListText(
  plan: WeeklyPlan,
  dishes: Dish[],
  day: DayOfWeek,
  monday: Date
): string {
  return ["Meal Assist", ...cookListLines(plan, dishes, day, monday)].join("\n");
}
