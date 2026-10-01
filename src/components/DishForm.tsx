"use client";

import { useState } from "react";
import {
  Dish,
  DishTag,
  DISH_TAGS,
  DISH_TAG_LABELS,
} from "@/domain/types";
import { GlassSheet } from "./GlassSheet";

type Props = {
  open: boolean;
  initial?: Dish;
  onSave: (dish: Dish) => void;
  onCancel: () => void;
};

function generateId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

export function DishForm({ open, initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [mealTypes, setMealTypes] = useState<DishTag[]>(initial?.mealTypes ?? []);

  const toggle = (tag: DishTag) => {
    setMealTypes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const isValid = name.trim().length > 0 && mealTypes.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      id: initial?.id ?? generateId(name),
      name: name.trim(),
      mealTypes,
      ingredients: initial?.ingredients ?? [],
      lastCooked: initial?.lastCooked,
      nutritionSummary: initial?.nutritionSummary,
      subtitle: initial?.subtitle,
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
    </GlassSheet>
  );
}
