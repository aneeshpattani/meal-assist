"use client";

import { MEAL_LABELS, MealType } from "@/domain/types";
import { GlassSheet } from "./GlassSheet";

type Props = {
  open: boolean;
  dishName: string;
  meal: MealType;
  dayLabel: string;
  isSnack?: boolean;
  onReplace: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export function EditRemoveSheet({
  open,
  dishName,
  meal,
  dayLabel,
  isSnack,
  onReplace,
  onRemove,
  onClose,
}: Props) {
  const mealLabel = isSnack ? "Snack" : MEAL_LABELS[meal];

  return (
    <GlassSheet open={open} onClose={onClose} compact hideClose>
      <div className="action-sheet">
        <div className="action-sheet-title">
          <h2>{dishName}</h2>
          <p>
            in {mealLabel} · {dayLabel}
          </p>
        </div>
        <button className="glass-btn" onClick={onReplace}>
          Replace dish
        </button>
        <button className="glass-btn danger" onClick={onRemove}>
          Remove from {isSnack ? "snack" : MEAL_LABELS[meal]}
        </button>
        <button className="glass-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </GlassSheet>
  );
}
