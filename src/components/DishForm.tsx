"use client";

import { useState } from "react";
import { Dish, Ingredient, MealType, MEAL_TYPES } from "@/domain/types";

type Props = {
  initial?: Dish;
  onSave: (dish: Dish) => void;
  onCancel: () => void;
};

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);
}

export function DishForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [mealTypes, setMealTypes] = useState<MealType[]>(
    initial?.mealTypes ?? []
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? []
  );
  const [newIngredient, setNewIngredient] = useState("");

  const toggleMealType = (mt: MealType) => {
    setMealTypes((prev) =>
      prev.includes(mt) ? prev.filter((t) => t !== mt) : [...prev, mt]
    );
  };

  const addIngredient = () => {
    const trimmed = newIngredient.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (ingredients.some((i) => i.id === id)) {
      setNewIngredient("");
      return;
    }
    setIngredients((prev) => [...prev, { id, name: trimmed }]);
    setNewIngredient("");
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = () => {
    if (!name.trim() || mealTypes.length === 0) return;
    onSave({
      id: initial?.id ?? generateId(name),
      name: name.trim(),
      mealTypes,
      ingredients,
      lastCooked: initial?.lastCooked,
      nutritionSummary: initial?.nutritionSummary,
    });
  };

  const isValid = name.trim().length > 0 && mealTypes.length > 0;

  return (
    <div className="form-overlay" onClick={onCancel}>
      <div className="form-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? "Edit Dish" : "New Dish"}</h2>

        <div className="form-field">
          <label>Dish Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Poha"
            autoFocus
            style={{ width: "100%" }}
          />
        </div>

        <div className="form-field">
          <label>Meal Types</label>
          <div className="meal-type-toggles">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt}
                type="button"
                className={`meal-toggle ${mealTypes.includes(mt) ? "selected" : ""}`}
                onClick={() => toggleMealType(mt)}
              >
                {mt.charAt(0).toUpperCase() + mt.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Ingredients (optional)</label>
          <div className="ingredient-rows">
            {ingredients.map((ing) => (
              <div key={ing.id} className="ingredient-row">
                <input type="text" value={ing.name} readOnly />
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removeIngredient(ing.id)}
                >
                  ×
                </button>
              </div>
            ))}
            <div className="ingredient-row">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add ingredient…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={addIngredient}
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {initial ? "Save Changes" : "Add Dish"}
          </button>
        </div>
      </div>
    </div>
  );
}
