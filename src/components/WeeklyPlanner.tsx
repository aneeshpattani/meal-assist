"use client";

import {
  DayOfWeek,
  DAYS,
  DAY_LETTERS,
  Dish,
  MEAL_LABELS_UPPER,
  MEAL_TYPES,
  MealType,
  WeeklyPlan,
} from "@/domain/types";
import {
  filledSlotCount,
  formatCollapsedDay,
  formatWeekRange,
  isMealFilled,
  mealIds,
  snackIds,
  slotSummary,
  weekHasMeals,
} from "@/domain/plan";
import { ChevronIcon, ShareIcon } from "./icons";

type EditTarget = {
  day: DayOfWeek;
  meal: MealType;
  dishId: string;
  isSnack?: boolean;
};

type Props = {
  plan: WeeklyPlan;
  dishes: Dish[];
  selectedDay: DayOfWeek;
  monday: Date;
  onSelectDay: (day: DayOfWeek) => void;
  onAddDish: (meal: MealType) => void;
  onAttachSnack: (meal: MealType) => void;
  onEditDish: (target: EditTarget) => void;
  onShare: () => void;
};

function dishName(dishes: Dish[], id: string) {
  return dishes.find((d) => d.id === id)?.name ?? id;
}

export function WeeklyPlanner({
  plan,
  dishes,
  selectedDay,
  monday,
  onSelectDay,
  onAddDish,
  onAttachSnack,
  onEditDish,
  onShare,
}: Props) {
  const dayPlan = plan[selectedDay];
  const emptyWeek = !weekHasMeals(plan);
  const otherDays = DAYS.filter((d) => d !== selectedDay);

  return (
    <div className="plan-view">
      <header className="page-header">
        <div>
          <h1>This week</h1>
          <p className="page-sub">{formatWeekRange(monday)}</p>
        </div>
        <button className="glass-chip-btn" onClick={onShare}>
          <ShareIcon />
          Share
        </button>
      </header>

      <div className="day-stepper-wrap">
        <div className="day-stepper" role="tablist" aria-label="Days">
          {DAYS.map((day) => {
            const filled = MEAL_TYPES.map((meal) => isMealFilled(plan[day], meal));
            const selected = day === selectedDay;
            return (
              <button
                key={day}
                role="tab"
                aria-selected={selected}
                className={`day-pill ${selected ? "selected" : ""}`}
                onClick={() => onSelectDay(day)}
              >
                <span>{DAY_LETTERS[day]}</span>
                <span className="day-dots" aria-hidden>
                  {filled.map((on, i) => (
                    <i key={i} className={on ? "on" : ""} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="plan-scroll">
        {emptyWeek && (
          <div className="empty-week">
            <h2>No meals yet this week</h2>
            <p>Plan Monday first — add a dish to Breakfast.</p>
          </div>
        )}

        {MEAL_TYPES.map((meal) => {
          const mains = mealIds(dayPlan, meal);
          const snacks = snackIds(dayPlan, meal);
          const hasDishes = mains.length > 0;
          return (
            <section key={meal} className="meal-card">
              <p className="meal-label">{MEAL_LABELS_UPPER[meal]}</p>
              {mains.map((id) => (
                <button
                  key={id}
                  className="meal-dish"
                  onClick={() =>
                    onEditDish({ day: selectedDay, meal, dishId: id })
                  }
                >
                  {dishName(dishes, id)}
                </button>
              ))}
              {snacks.map((id) => (
                <button
                  key={`snack-${id}`}
                  className="meal-snack"
                  onClick={() =>
                    onEditDish({
                      day: selectedDay,
                      meal,
                      dishId: id,
                      isSnack: true,
                    })
                  }
                >
                  Snack · {dishName(dishes, id)}
                </button>
              ))}
              {hasDishes ? (
                <div className="meal-actions">
                  <button className="text-accent" onClick={() => onAddDish(meal)}>
                    + Add dish
                  </button>
                  {snacks.length === 0 && (
                    <button
                      className="text-quiet"
                      onClick={() => onAttachSnack(meal)}
                    >
                      Attach snack
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className="text-accent add-empty"
                  onClick={() => onAddDish(meal)}
                >
                  + Add dish
                </button>
              )}
            </section>
          );
        })}

        <div className="other-days">
          {otherDays.map((day) => (
            <button
              key={day}
              className="collapsed-day"
              onClick={() => onSelectDay(day)}
            >
              <span className="collapsed-left">
                <ChevronIcon />
                {formatCollapsedDay(monday, day)}
              </span>
              <span>{slotSummary(filledSlotCount(plan[day]))}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
