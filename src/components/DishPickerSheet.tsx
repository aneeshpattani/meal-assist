"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dish,
  DISH_TAG_LABELS,
  MEAL_LABELS,
  MealType,
  dishSubtitle,
} from "@/domain/types";
import { CheckIcon, SearchIcon } from "./icons";
import { GlassSheet } from "./GlassSheet";

type Segment = "recent" | "favorites" | "all";

type Props = {
  open: boolean;
  mode: "dish" | "snack";
  meal: MealType;
  dishes: Dish[];
  recentIds: string[];
  favoriteIds: string[];
  selectedId?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (dishId: string) => void;
  onCreate?: () => void;
};

export function DishPickerSheet({
  open,
  mode,
  meal,
  dishes,
  recentIds,
  favoriteIds,
  selectedId,
  confirmLabel,
  onClose,
  onConfirm,
  onCreate,
}: Props) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("recent");
  const [picked, setPicked] = useState<string | undefined>(selectedId);

  const eligible = useMemo(() => {
    const tag = mode === "snack" ? "snack" : meal;
    return dishes.filter((d) => d.mealTypes.includes(tag));
  }, [dishes, meal, mode]);

  useEffect(() => {
    if (selectedId) {
      setPicked(selectedId);
      return;
    }
    if (eligible[0]) setPicked(eligible[0].id);
  }, [selectedId, eligible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = eligible;
    if (segment === "recent") {
      const rank = new Map(recentIds.map((id, i) => [id, i]));
      list = eligible
        .filter((d) => rank.has(d.id))
        .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
      if (list.length === 0) list = eligible;
    } else if (segment === "favorites") {
      list = eligible.filter((d) => favoriteIds.includes(d.id));
    }
    if (!q) return list;
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        dishSubtitle(d).toLowerCase().includes(q)
    );
  }, [eligible, favoriteIds, query, recentIds, segment]);

  const selected = dishes.find((d) => d.id === picked);
  const mealLabel = MEAL_LABELS[meal];
  const title = mode === "snack" ? "Attach snack" : "Add dish";
  const cta = selected
    ? confirmLabel ??
      (mode === "snack"
        ? `Attach ${selected.name}`
        : `Add ${selected.name} to ${mealLabel}`)
    : mode === "snack"
      ? "Attach snack"
      : `Add to ${mealLabel}`;

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={mode === "snack" ? `${mealLabel}` : undefined}
      tall
      footer={
        <button
          className="glass-cta"
          disabled={!selected}
          onClick={() => selected && onConfirm(selected.id)}
        >
          {cta}
        </button>
      }
    >
      {mode === "dish" && (
        <div className="meal-lock-chip">
          <span className="meal-lock-dot" />
          {DISH_TAG_LABELS[meal]}
        </div>
      )}

      <label className="glass-search">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "snack" ? "Search snacks" : "Search dishes"}
        />
      </label>

      {mode === "dish" && (
        <div className="seg-bar" role="tablist">
          {(
            [
              ["recent", "Recent"],
              ["favorites", "Favorites"],
              ["all", "All"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={segment === id}
              className={`seg-btn ${segment === id ? "active" : ""}`}
              onClick={() => setSegment(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {mode === "snack" && (
        <p className="picker-section-label">Recent</p>
      )}

      <div className="picker-list">
        {filtered.length === 0 ? (
          <div className="picker-empty">
            <p>
              {mode === "snack"
                ? "No snack-tagged dishes yet."
                : `No dishes tagged for ${mealLabel.toLowerCase()}.`}
            </p>
            {onCreate && (
              <button className="text-accent" onClick={onCreate}>
                + Add a dish
              </button>
            )}
          </div>
        ) : (
          filtered.map((dish) => {
            const active = picked === dish.id;
            return (
              <button
                key={dish.id}
                className={`pick-row ${active ? "selected" : ""}`}
                onClick={() => setPicked(dish.id)}
              >
                <span className={`pick-radio ${active ? "on" : ""}`} />
                <span className="pick-copy">
                  <span className="pick-name">{dish.name}</span>
                  <span className="pick-sub">{dishSubtitle(dish)}</span>
                </span>
                {active && <CheckIcon className="pick-check" />}
              </button>
            );
          })
        )}
      </div>
    </GlassSheet>
  );
}
