"use client";

import { useState } from "react";
import {
  DAY_SHORT,
  Dish,
  DayOfWeek,
  MEAL_LABELS,
  MEAL_SHORT,
  MEAL_TYPES,
  WeeklyPlan,
} from "@/domain/types";
import {
  cookListText,
  dateForDay,
  mealIds,
  snackIds,
  dishName,
} from "@/domain/plan";
import { ChatIcon, CopyIcon, DocIcon } from "./icons";
import { GlassSheet } from "./GlassSheet";

type Props = {
  open: boolean;
  plan: WeeklyPlan;
  dishes: Dish[];
  day: DayOfWeek;
  monday: Date;
  onClose: () => void;
  onOpenCookView?: () => void;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function ShareSheet({
  open,
  plan,
  dishes,
  day,
  monday,
  onClose,
  onOpenCookView,
}: Props) {
  const [copied, setCopied] = useState(false);
  const date = dateForDay(monday, day);
  const dayPlan = plan[day];
  const text = cookListText(plan, dishes, day, monday);
  const subtitle = `${DAY_SHORT[day]}day · ${date.getDate()} ${MONTHS[date.getMonth()]}`;

  const share = async (channel: "whatsapp" | "messages" | "copy" | "pdf") => {
    if (channel === "copy") {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        setCopied(false);
      }
      return;
    }
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      return;
    }
    if (channel === "messages") {
      window.location.href = `sms:?body=${encodeURIComponent(text)}`;
      return;
    }
    if (onOpenCookView) onOpenCookView();
    else window.print();
  };

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="Share cook plan"
      subtitle={subtitle}
      footer={
        <button className="glass-btn" onClick={onClose}>
          Cancel
        </button>
      }
    >
      <div className="cook-card">
        <div className="cook-card-head">
          <div>
            <p className="cook-kicker">Meal Assist</p>
            <h3>{DAY_SHORT[day]}day cook list</h3>
          </div>
          <span className="cook-date">
            {date.getDate()} {MONTHS[date.getMonth()]}
          </span>
        </div>
        <div className="cook-meals">
          {MEAL_TYPES.map((meal) => {
            const mains = mealIds(dayPlan, meal).map((id) => dishName(dishes, id));
            const snacks = snackIds(dayPlan, meal).map((id) => dishName(dishes, id));
            const items = [...mains, ...snacks];
            return (
              <div key={meal} className="cook-meal-row">
                <span className="cook-badge">{MEAL_SHORT[meal]}</span>
                <div>
                  <p className="cook-meal-name">{MEAL_LABELS[meal]}</p>
                  <p className="cook-meal-items">{items.length ? items.join(" · ") : "—"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="picker-section-label">Send via</p>
      <div className="share-grid">
        <button className="share-channel" onClick={() => share("whatsapp")}>
          <span className="share-channel-icon">
            <ChatIcon />
          </span>
          WhatsApp
        </button>
        <button className="share-channel" onClick={() => share("messages")}>
          <span className="share-channel-icon">
            <ChatIcon />
          </span>
          Messages
        </button>
        <button className="share-channel" onClick={() => share("copy")}>
          <span className="share-channel-icon">
            <CopyIcon />
          </span>
          {copied ? "Copied" : "Copy"}
        </button>
        <button className="share-channel" onClick={() => share("pdf")}>
          <span className="share-channel-icon">
            <DocIcon />
          </span>
          PDF
        </button>
      </div>
    </GlassSheet>
  );
}
