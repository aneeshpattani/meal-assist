import { Dish, WeeklyPlan, emptyWeeklyPlan } from "@/domain/types";
import { normalizePlan, stripDishFromPlan } from "@/domain/plan";
import { DishRepository, PlanRepository } from "@/data/repository";

export function createMemoryDishRepo(initial: Dish[]): DishRepository {
  let dishes = [...initial];
  return {
    async getAll() {
      return [...dishes];
    },
    async getById(id) {
      return dishes.find((d) => d.id === id);
    },
    async save(dish) {
      const idx = dishes.findIndex((d) => d.id === dish.id);
      if (idx >= 0) dishes[idx] = dish;
      else dishes.push(dish);
    },
    async remove(id) {
      dishes = dishes.filter((d) => d.id !== id);
    },
  };
}

export function createMemoryPlanRepo(initial?: WeeklyPlan): PlanRepository {
  let plan = normalizePlan(initial ?? emptyWeeklyPlan());
  return {
    async get() {
      return plan;
    },
    async save(next) {
      plan = next;
    },
  };
}

export function createLinkedMemoryRepos(initialDishes: Dish[], initialPlan?: WeeklyPlan) {
  let dishes = [...initialDishes];
  let plan = normalizePlan(initialPlan ?? emptyWeeklyPlan());

  const dishRepo: DishRepository = {
    async getAll() {
      return [...dishes];
    },
    async getById(id) {
      return dishes.find((d) => d.id === id);
    },
    async save(dish) {
      const idx = dishes.findIndex((d) => d.id === dish.id);
      if (idx >= 0) dishes[idx] = dish;
      else dishes.push(dish);
    },
    async remove(id) {
      dishes = dishes.filter((d) => d.id !== id);
      plan = stripDishFromPlan(plan, id);
    },
  };

  const planRepo: PlanRepository = {
    async get() {
      return plan;
    },
    async save(next) {
      plan = next;
    },
  };

  return { dishRepo, planRepo };
}
