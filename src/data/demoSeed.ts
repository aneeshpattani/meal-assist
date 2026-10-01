import { Dish, WeeklyPlan, emptyWeeklyPlan } from "@/domain/types";

export const DEMO_DISHES: Dish[] = [
  {
    id: "idli",
    name: "Idli",
    mealTypes: ["breakfast"],
    subtitle: "South Indian · steamed",
    ingredients: [{ id: "rice", name: "Rice" }],
  },
  {
    id: "coconut-chutney",
    name: "Coconut chutney",
    mealTypes: ["breakfast", "snack"],
    ingredients: [{ id: "coconut", name: "Coconut" }],
  },
  {
    id: "poha",
    name: "Poha",
    mealTypes: ["breakfast"],
    subtitle: "Maharashtrian",
    ingredients: [{ id: "poha", name: "Poha" }],
  },
  {
    id: "upma",
    name: "Upma",
    mealTypes: ["breakfast", "tea"],
    subtitle: "Semolina",
    ingredients: [{ id: "rava", name: "Semolina" }],
  },
  {
    id: "dal-tadka",
    name: "Dal tadka",
    mealTypes: ["lunch", "dinner"],
    ingredients: [{ id: "dal", name: "Toor dal" }],
  },
  {
    id: "jeera-rice",
    name: "Jeera rice",
    mealTypes: ["lunch", "dinner"],
    ingredients: [{ id: "rice", name: "Rice" }],
  },
  {
    id: "buttermilk",
    name: "Buttermilk",
    mealTypes: ["lunch", "snack"],
    ingredients: [{ id: "yogurt", name: "Yogurt" }],
  },
  {
    id: "masala-chai",
    name: "Masala chai",
    mealTypes: ["tea"],
    ingredients: [{ id: "tea", name: "Tea" }],
  },
  {
    id: "fruit-bowl",
    name: "Fruit bowl",
    mealTypes: ["snack"],
    ingredients: [{ id: "fruit", name: "Fruit" }],
  },
  {
    id: "roasted-chana",
    name: "Roasted chana",
    mealTypes: ["snack"],
    ingredients: [{ id: "chana", name: "Chana" }],
  },
  {
    id: "yogurt",
    name: "Yogurt",
    mealTypes: ["snack"],
    ingredients: [{ id: "yogurt", name: "Yogurt" }],
  },
  {
    id: "banana-shake",
    name: "Banana shake",
    mealTypes: ["snack"],
    ingredients: [{ id: "banana", name: "Banana" }],
  },
];

export function demoFilledPlan(): WeeklyPlan {
  const plan = emptyWeeklyPlan();
  plan.monday = {
    breakfast: ["idli", "coconut-chutney"],
    lunch: ["dal-tadka", "jeera-rice"],
    tea: ["masala-chai"],
    snacks: { lunch: ["buttermilk"] },
  };
  plan.wednesday = {
    lunch: ["dal-tadka"],
    dinner: ["jeera-rice"],
  };
  plan.thursday = {
    breakfast: ["poha"],
  };
  plan.saturday = {
    lunch: ["dal-tadka"],
    tea: ["masala-chai"],
  };
  return plan;
}
