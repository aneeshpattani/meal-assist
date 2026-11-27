"use client";

import { BookmarkIcon, ListIcon, MoreIcon } from "./icons";

export type AppTab = "plan" | "dishes" | "more";

type Props = {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
  hidden?: boolean;
};

const TABS: { id: AppTab; label: string; Icon: typeof BookmarkIcon }[] = [
  { id: "plan", label: "Plan", Icon: BookmarkIcon },
  { id: "dishes", label: "Dishes", Icon: ListIcon },
  { id: "more", label: "More", Icon: MoreIcon },
];

export function TabBar({ tab, onChange, hidden }: Props) {
  return (
    <nav
      className={`tab-bar${hidden ? " tab-bar-hidden" : ""}`}
      aria-label="Main"
      aria-hidden={hidden || undefined}
      inert={hidden ? true : undefined}
    >
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
