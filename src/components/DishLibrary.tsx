"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Dish } from "@/domain/types";
import { DishRepository } from "@/data/repository";
import { createSupabaseDishRepo } from "@/data/supabaseRepo";
import { useSupabase } from "@/hooks/useSupabase";
import { DishForm } from "./DishForm";

type Props = { householdId: string };

export function DishLibrary({ householdId }: Props) {
  const supabase = useSupabase();
  const repo: DishRepository = useMemo(
    () => createSupabaseDishRepo(supabase, householdId),
    [supabase, householdId]
  );

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const all = await repo.getAll();
      setDishes(all);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dishes");
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = async (dish: Dish) => {
    await repo.save(dish);
    await refresh();
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This will also remove it from your weekly plan.`)) return;
    await repo.remove(id);
    await refresh();
  };

  const openEdit = (dish: Dish) => {
    setEditing(dish);
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  if (loading) return <div className="loading-state">Loading dishes...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div>
      <div className="dish-library-header">
        <h2>Your Dishes</h2>
        <button className="btn btn-primary" onClick={openNew}>
          + New Dish
        </button>
      </div>

      {dishes.length === 0 ? (
        <div className="empty-state">
          <p>No dishes yet. Add your first dish to get started.</p>
          <button className="btn btn-primary" onClick={openNew}>
            + New Dish
          </button>
        </div>
      ) : (
        <div className="dish-grid">
          {dishes.map((dish) => (
            <div key={dish.id} className="card dish-card">
              <div className="dish-card-header">
                <h3>{dish.name}</h3>
                <div className="dish-card-actions">
                  <button
                    className="btn-ghost"
                    onClick={() => openEdit(dish)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(dish.id, dish.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="dish-card-chips">
                {dish.mealTypes.map((mt) => (
                  <span key={mt} className="chip">
                    {mt.charAt(0).toUpperCase() + mt.slice(1)}
                  </span>
                ))}
              </div>
              {dish.ingredients.length > 0 && (
                <div className="dish-card-ingredients">
                  {dish.ingredients.map((i) => i.name).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DishForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}
