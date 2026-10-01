"use client";

import {
  DAYS,
  DAY_SHORT,
  Dish,
  MEAL_LABELS,
  MEAL_SHORT,
  MEAL_TYPES,
  WeeklyPlan,
} from "@/domain/types";
import {
  dateForDay,
  dishName,
  formatWeekRange,
  mealIds,
  snackIds,
} from "@/domain/plan";

type Props = {
  plan: WeeklyPlan;
  dishes: Dish[];
  monday: Date;
  onBack?: () => void;
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

export function CookView({ plan, dishes, monday, onBack }: Props) {
  return (
    <div className="cook-view">
      <header className="page-header">
        <div>
          <h1>Cook plan</h1>
          <p className="page-sub">{formatWeekRange(monday)}</p>
        </div>
        <div className="cook-view-actions">
          <button className="glass-chip-btn" onClick={() => window.print()}>
            Print / PDF
          </button>
          {onBack && (
            <button className="glass-chip-btn" onClick={onBack}>
              Back
            </button>
          )}
        </div>
      </header>

      <div className="cook-week">
        {DAYS.map((day) => {
          const date = dateForDay(monday, day);
          const dayPlan = plan[day];
          return (
            <article key={day} className="cook-card">
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
                  const mains = mealIds(dayPlan, meal).map((id) =>
                    dishName(dishes, id)
                  );
                  const snacks = snackIds(dayPlan, meal).map((id) =>
                    dishName(dishes, id)
                  );
                  const items = [...mains, ...snacks];
                  return (
                    <div key={meal} className="cook-meal-row">
                      <span className="cook-badge">{MEAL_SHORT[meal]}</span>
                      <div>
                        <p className="cook-meal-name">{MEAL_LABELS[meal]}</p>
                        <p className="cook-meal-items">
                          {items.length ? items.join(" · ") : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
