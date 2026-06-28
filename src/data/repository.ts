import { Dish, WeeklyPlan } from "@/domain/types";

export interface DishRepository {
  getAll(): Promise<Dish[]>;
  getById(id: string): Promise<Dish | undefined>;
  save(dish: Dish): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface PlanRepository {
  get(): Promise<WeeklyPlan>;
  save(plan: WeeklyPlan): Promise<void>;
}
