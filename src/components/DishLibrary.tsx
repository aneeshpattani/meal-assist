"use client";

import { useMemo, useState } from "react";
import {
  Dish,
  DishTag,
  DISH_TAG_LABELS,
  DISH_TAGS,
} from "@/domain/types";
import { SearchIcon } from "./icons";

type Filter = "all" | DishTag;

type Props = {
  dishes: Dish[];
  onAdd: () => void;
  onEdit: (dish: Dish) => void;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  ...DISH_TAGS.filter((t) => t !== "snack").map((id) => ({
    id,
    label: DISH_TAG_LABELS[id],
  })),
];

export function DishLibrary({ dishes, onAdd, onEdit }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((dish) => {
      const matchesFilter =
        filter === "all" || dish.mealTypes.includes(filter);
      const matchesQuery =
        !q ||
        dish.name.toLowerCase().includes(q) ||
        dish.mealTypes.some((t) => DISH_TAG_LABELS[t].toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [dishes, filter, query]);

  return (
    <div className="dishes-view">
      <header className="page-header">
        <div>
          <h1>Dishes</h1>
          <p className="page-sub">
            {dishes.length} {dishes.length === 1 ? "dish" : "dishes"} · meal tags
          </p>
        </div>
        <button className="glass-chip-btn" onClick={onAdd}>
          + Add
        </button>
      </header>

      <div className="dishes-tools">
        <label className="glass-search">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes"
          />
        </label>
        <div className="filter-row">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              className={`filter-chip ${filter === item.id ? "selected" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dish-list">
        {visible.length === 0 ? (
          <div className="empty-week">
            <h2>No dishes yet</h2>
            <p>Add your first dish to start planning the week.</p>
            <button className="text-accent" onClick={onAdd}>
              + Add dish
            </button>
          </div>
        ) : (
          visible.map((dish) => (
            <button
              key={dish.id}
              className="dish-row"
              onClick={() => onEdit(dish)}
            >
              <span className="dish-row-name">{dish.name}</span>
              <span className="dish-row-tags">
                {dish.mealTypes.map((tag) => (
                  <span key={tag} className="matte-tag">
                    {DISH_TAG_LABELS[tag]}
                  </span>
                ))}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
