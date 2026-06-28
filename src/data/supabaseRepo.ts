import { SupabaseClient } from "@supabase/supabase-js";
import { Dish, Ingredient, MealType, WeeklyPlan, emptyWeeklyPlan } from "@/domain/types";
import { DishRepository, PlanRepository } from "@/data/repository";

type DishRow = {
  id: string;
  household_id: string;
  name: string;
  meal_types: string[];
  ingredients: Ingredient[];
  last_cooked: string | null;
  nutrition_summary: Record<string, number> | null;
};

function rowToDish(row: DishRow): Dish {
  return {
    id: row.id,
    name: row.name,
    mealTypes: row.meal_types as MealType[],
    ingredients: row.ingredients,
    lastCooked: row.last_cooked ?? undefined,
    nutritionSummary: row.nutrition_summary ?? undefined,
  };
}

export function createSupabaseDishRepo(
  supabase: SupabaseClient,
  householdId: string
): DishRepository {
  return {
    async getAll(): Promise<Dish[]> {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("household_id", householdId);
      if (error) throw error;
      return (data as DishRow[]).map(rowToDish);
    },

    async getById(id: string): Promise<Dish | undefined> {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("household_id", householdId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToDish(data as DishRow) : undefined;
    },

    async save(dish: Dish): Promise<void> {
      const { error } = await supabase.from("dishes").upsert({
        id: dish.id,
        household_id: householdId,
        name: dish.name,
        meal_types: dish.mealTypes,
        ingredients: dish.ingredients,
        last_cooked: dish.lastCooked ?? null,
        nutrition_summary: dish.nutritionSummary ?? null,
      });
      if (error) throw error;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase
        .from("dishes")
        .delete()
        .eq("household_id", householdId)
        .eq("id", id);
      if (error) throw error;
    },
  };
}

export function createSupabasePlanRepo(
  supabase: SupabaseClient,
  householdId: string
): PlanRepository {
  return {
    async get(): Promise<WeeklyPlan> {
      const { data, error } = await supabase
        .from("weekly_plans")
        .select("plan")
        .eq("household_id", householdId)
        .maybeSingle();
      if (error) throw error;
      return data?.plan ?? emptyWeeklyPlan();
    },

    async save(plan: WeeklyPlan): Promise<void> {
      const { error } = await supabase.from("weekly_plans").upsert({
        household_id: householdId,
        plan,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
  };
}
