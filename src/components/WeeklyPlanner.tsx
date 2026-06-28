"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  WeeklyPlan,
  DayOfWeek,
  MealType,
  DAYS,
  MEAL_TYPES,
  Dish,
  emptyWeeklyPlan,
} from "@/domain/types";
import { DishRepository, PlanRepository } from "@/data/repository";
import { createSupabaseDishRepo, createSupabasePlanRepo } from "@/data/supabaseRepo";
import { useSupabase } from "@/hooks/useSupabase";

type Props = { householdId: string };
type PickerState = { day: DayOfWeek; meal: MealType } | null;

export function WeeklyPlanner({ householdId }: Props) {
  const supabase = useSupabase();
  const dishRepo: DishRepository = useMemo(
    () => createSupabaseDishRepo(supabase, householdId),
    [supabase, householdId]
  );
  const planRepo: PlanRepository = useMemo(
    () => createSupabasePlanRepo(supabase, householdId),
    [supabase, householdId]
  );

  const [plan, setPlan] = useState<WeeklyPlan>(emptyWeeklyPlan);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [picker, setPicker] = useState<PickerState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [loadedDishes, loadedPlan] = await Promise.all([
        dishRepo.getAll(),
        planRepo.get(),
      ]);
      setDishes(loadedDishes);
      setPlan(loadedPlan);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [dishRepo, planRepo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPicker(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const savePlan = async (updated: WeeklyPlan) => {
    setPlan(updated);
    await planRepo.save(updated);
  };

  const addDish = async (day: DayOfWeek, meal: MealType, dishId: string) => {
    const updated = { ...plan };
    const dayPlan = { ...updated[day] };
    const current = dayPlan[meal] ?? [];
    if (!current.includes(dishId)) {
      dayPlan[meal] = [...current, dishId];
    }
    updated[day] = dayPlan;
    await savePlan(updated);
    setPicker(null);
  };

  const removeDish = async (day: DayOfWeek, meal: MealType, dishId: string) => {
    const updated = { ...plan };
    const dayPlan = { ...updated[day] };
    dayPlan[meal] = (dayPlan[meal] ?? []).filter((id) => id !== dishId);
    updated[day] = dayPlan;
    await savePlan(updated);
  };

  const getDishName = (id: string): string => {
    return dishes.find((d) => d.id === id)?.name ?? id;
  };

  const dayLabel = (d: DayOfWeek) =>
    d.charAt(0).toUpperCase() + d.slice(1, 3);

  if (loading) return <div className="loading-state">Loading planner...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Weekly Planner</h2>
      {dishes.length === 0 ? (
        <div className="empty-state">
          <p>Add some dishes first, then come back to plan your week.</p>
        </div>
      ) : (
        <div className="planner-grid">
          {DAYS.map((day) => (
            <div key={day} className="planner-day">
              <h4>{dayLabel(day)}</h4>
              {MEAL_TYPES.map((meal) => {
                const ids = plan[day][meal] ?? [];
                const isPickerOpen =
                  picker?.day === day && picker?.meal === meal;
                const eligible = dishes.filter((d) => d.mealTypes.includes(meal));
                return (
                  <div key={meal} className="planner-meal-section">
                    <div className="planner-meal-label">{meal}</div>
                    {ids.map((id) => (
                      <div key={id} className="planner-dish-tag">
                        <span>{getDishName(id)}</span>
                        <button onClick={() => removeDish(day, meal, id)}>
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="dish-picker" ref={isPickerOpen ? pickerRef : undefined}>
                      <button
                        className="planner-add-btn"
                        onClick={() =>
                          setPicker(isPickerOpen ? null : { day, meal })
                        }
                      >
                        + Add
                      </button>
                      {isPickerOpen && (
                        <div className="dish-picker-dropdown">
                          {eligible.length === 0 ? (
                            <div className="dish-picker-item">No dishes for {meal}</div>
                          ) : (
                            eligible.map((d) => (
                              <button
                                key={d.id}
                                className="dish-picker-item"
                                onClick={() => addDish(day, meal, d.id)}
                              >
                                {d.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
