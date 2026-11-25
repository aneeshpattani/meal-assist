"use client";

import { useState } from "react";
import {
  Dish,
  DishTag,
  DISH_TAGS,
  DISH_TAG_LABELS,
  Ingredient,
  normalizeDishNotes,
} from "@/domain/types";
import {
  DISH_NAME_MAX_LENGTH,
  generateDishId,
  normalizeDishName,
} from "@/domain/dishPicker";
import { GlassSheet } from "./GlassSheet";

type Props = {
  open: boolean;
  initial?: Dish;
  onSave: (dish: Dish) => void;
  onCancel: () => void;
};

export function DishForm({ open, initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [mealTypes, setMealTypes] = useState<DishTag[]>(initial?.mealTypes ?? []);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? []
  );
  const [newIngredient, setNewIngredient] = useState("");

  const toggle = (tag: DishTag) => {
    setMealTypes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addIngredient = () => {
    const trimmed = newIngredient.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (ingredients.some((item) => item.id === id)) {
      setNewIngredient("");
      return;
    }
    setIngredients((prev) => [...prev, { id, name: trimmed }]);
    setNewIngredient("");
  };

  const normalizedName = normalizeDishName(name);
  const isValid =
    normalizedName.length > 0 &&
    normalizedName.length <= DISH_NAME_MAX_LENGTH &&
    mealTypes.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      id: initial?.id ?? generateDishId(normalizedName),
      name: normalizedName,
      mealTypes,
      ingredients,
      lastCooked: initial?.lastCooked,
      nutritionSummary: initial?.nutritionSummary,
      subtitle: initial?.subtitle,
      notes: normalizeDishNotes(initial?.notes) ?? undefined,
    });
  };

  return (
    <GlassSheet
      open={open}
      onClose={onCancel}
      title={initial ? "Edit dish" : "New dish"}
      footer={
        <button className="glass-cta" disabled={!isValid} onClick={handleSubmit}>
          Save dish
        </button>
      }
    >
      <div className="form-field">
        <label>Name</label>
        <input
          className="glass-input"
          type="text"
          value={name}
          maxLength={DISH_NAME_MAX_LENGTH}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Poha"
          autoFocus
        />
      </div>
      <div className="form-field">
        <label>Meal tags</label>
        <div className="tag-toggles">
          {DISH_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-toggle ${mealTypes.includes(tag) ? "selected" : ""}`}
              onClick={() => toggle(tag)}
            >
              {DISH_TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label>Ingredients (optional)</label>
        <div className="ingredient-rows">
          {ingredients.map((ing) => (
            <div key={ing.id} className="ingredient-row">
              <input className="glass-input" type="text" value={ing.name} readOnly />
              <button
                type="button"
                className="text-quiet"
                onClick={() =>
                  setIngredients((prev) => prev.filter((item) => item.id !== ing.id))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <div className="ingredient-row">
            <input
              className="glass-input"
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
            <button type="button" className="text-accent" onClick={addIngredient}>
              Add
            </button>
          </div>
        </div>
      </div>
    </GlassSheet>
  );
}
