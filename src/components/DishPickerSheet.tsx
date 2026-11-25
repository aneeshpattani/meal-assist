"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dish,
  DISH_TAG_LABELS,
  DishTag,
  MEAL_LABELS,
  MealType,
  dishSubtitle,
} from "@/domain/types";
import {
  DISH_NAME_MAX_LENGTH,
  dishNameKey,
  filterDishesForPicker,
  normalizeDishName,
  shouldShowCreateRow,
} from "@/domain/dishPicker";
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
  selectedIds: string[];
  selectedId?: string;
  busy?: boolean;
  error?: string | null;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (dishId: string) => void;
  onCreateDish: (name: string) => void;
};

export function DishPickerSheet({
  open,
  mode,
  meal,
  dishes,
  recentIds,
  favoriteIds,
  selectedIds,
  selectedId,
  busy = false,
  error = null,
  confirmLabel,
  onClose,
  onConfirm,
  onCreateDish,
}: Props) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [picked, setPicked] = useState<string | undefined>(selectedId);
  const slotTag: DishTag = mode === "snack" ? "snack" : meal;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    if (selectedId) {
      setPicked(selectedId);
      return;
    }
    const createdMatch = dishes.find(
      (dish) =>
        selectedSet.has(dish.id) && dishNameKey(dish.name) === dishNameKey(query)
    );
    if (createdMatch) {
      setPicked(createdMatch.id);
    }
  }, [dishes, query, selectedId, selectedSet]);

  const visible = useMemo(() => {
    const searching = normalizeDishName(query).length > 0;
    let pool = dishes;
    if (!searching) {
      if (segment === "recent") {
        const rank = new Map(recentIds.map((id, i) => [id, i]));
        pool = dishes
          .filter((d) => rank.has(d.id))
          .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
        if (pool.length === 0) pool = dishes;
      } else if (segment === "favorites") {
        pool = dishes.filter((d) => favoriteIds.includes(d.id));
      }
    }
    return filterDishesForPicker(pool, query, slotTag, selectedIds);
  }, [dishes, favoriteIds, query, recentIds, segment, selectedIds, slotTag]);

  const showCreate = shouldShowCreateRow(dishes, query);
  const createLabel = normalizeDishName(query);
  const selected = dishes.find((d) => d.id === picked);
  const alreadyAdded = selected ? selectedSet.has(selected.id) : false;
  const mealLabel = MEAL_LABELS[meal];
  const title = mode === "snack" ? "Attach snack" : "Add dish";
  const cta = selected
    ? confirmLabel ??
      (alreadyAdded
        ? `${selected.name} added`
        : mode === "snack"
          ? `Attach ${selected.name}`
          : `Add ${selected.name} to ${mealLabel}`)
    : mode === "snack"
      ? "Attach snack"
      : `Add to ${mealLabel}`;

  return (
    <GlassSheet
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      subtitle={mode === "snack" ? mealLabel : undefined}
      tall
      footer={
        <button
          className="glass-cta"
          disabled={!selected || busy || alreadyAdded}
          onClick={() => selected && onConfirm(selected.id)}
        >
          {busy ? "Saving…" : cta}
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
          maxLength={DISH_NAME_MAX_LENGTH}
          disabled={busy}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && showCreate && !busy) {
              e.preventDefault();
              onCreateDish(createLabel);
            }
          }}
          placeholder={mode === "snack" ? "Search or create a snack" : "Search or create a dish"}
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

      {error && (
        <p className="sheet-inline-error" role="alert">
          {error}
        </p>
      )}

      <div className="picker-list">
        {showCreate && (
          <button
            type="button"
            className="pick-row create"
            disabled={busy}
            onClick={() => onCreateDish(createLabel)}
          >
            <span className="pick-copy">
              <span className="pick-name">
                {busy ? "Creating…" : `Create “${createLabel}”`}
              </span>
              <span className="pick-sub">
                Adds it to {mode === "snack" ? "snacks" : mealLabel.toLowerCase()}
              </span>
            </span>
          </button>
        )}
        {visible.length === 0 && !showCreate && (
          <div className="picker-empty">
            <p>
              {query.trim()
                ? "No matching dishes."
                : mode === "snack"
                  ? "No snack-tagged dishes yet. Search to create one."
                  : "Search to add an existing dish or create a new one."}
            </p>
          </div>
        )}
        {visible.map((dish) => {
          const active = picked === dish.id;
          const added = selectedSet.has(dish.id);
          return (
            <button
              key={dish.id}
              className={`pick-row ${active ? "selected" : ""}`}
              disabled={busy}
              onClick={() => setPicked(dish.id)}
            >
              <span className={`pick-radio ${active ? "on" : ""}`} />
              <span className="pick-copy">
                <span className="pick-name">{dish.name}</span>
                <span className="pick-sub">{dishSubtitle(dish)}</span>
              </span>
              {added && <span className="matte-tag">Added</span>}
              {active && !added && <CheckIcon className="pick-check" />}
            </button>
          );
        })}
      </div>
    </GlassSheet>
  );
}
