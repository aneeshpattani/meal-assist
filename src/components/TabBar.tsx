"use client";

import { BookmarkIcon, ListIcon, MoreIcon } from "./icons";

export type AppTab = "plan" | "dishes" | "more";

type Props = {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
};

const TABS: { id: AppTab; label: string; Icon: typeof BookmarkIcon }[] = [
  { id: "plan", label: "Plan", Icon: BookmarkIcon },
  { id: "dishes", label: "Dishes", Icon: ListIcon },
  { id: "more", label: "More", Icon: MoreIcon },
];

export function TabBar({ tab, onChange }: Props) {
  return (
    <nav className="tab-bar" aria-label="Main">
      <div className="tab-fade" />
      <div className="tab-capsule">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-item ${tab === id ? "active" : ""}`}
            onClick={() => onChange(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
