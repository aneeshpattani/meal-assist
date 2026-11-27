"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DayOfWeek,
  Dish,
  DishTag,
  MealType,
  WeeklyPlan,
  emptyWeeklyPlan,
  normalizeDishNotes,
} from "@/domain/types";
import {
  addDishToMeal,
  formatCollapsedDay,
  mealIds,
  removeDishFromMeal,
  removeSnackFromMeal,
  setSnackOnMeal,
  snackIds,
  startOfWeek,
  todayDayOfWeek,
} from "@/domain/plan";
import {
  appendMealTag,
  buildInlineDish,
  hasExactDishNameMatch,
  validateDishName,
} from "@/domain/dishPicker";
import { DishRepository, PlanRepository } from "@/data/repository";
import { useDishLists } from "@/hooks/useDishLists";
import { WeeklyPlanner } from "./WeeklyPlanner";
import { DishLibrary } from "./DishLibrary";
import { DishForm } from "./DishForm";
import { DishPickerSheet } from "./DishPickerSheet";
import { EditRemoveSheet } from "./EditRemoveSheet";
import { ShareSheet } from "./ShareSheet";
import { MoreSheet } from "./MoreSheet";
import { CookView } from "./CookView";
import { TabBar, AppTab } from "./TabBar";
import { AppChromeSkeleton } from "./AppChromeSkeleton";

type PickerMode = "dish" | "snack" | "replace";

type ActiveSheet =
  | {
      type: "picker";
      mode: PickerMode;
      meal: MealType;
      replaceId?: string;
      isSnack?: boolean;
    }
  | {
      type: "edit";
      day: DayOfWeek;
      meal: MealType;
      dishId: string;
      isSnack?: boolean;
    }
  | { type: "form"; dish?: Dish }
  | { type: "share" }
  | { type: "more" }
  | null;

type Props = {
  dishRepo: DishRepository;
  planRepo: PlanRepository;
  listScope?: string;
  inviteCode?: string | null;
  onSignOut?: () => void;
  initialTab?: AppTab;
  initialDay?: DayOfWeek;
  initialSheet?:
    | "picker"
    | "snack"
    | "share"
    | "edit"
    | "form"
    | "more"
    | "cook"
    | null;
  hideTabBar?: boolean;
};

function initialActiveSheet(
  initialSheet: Props["initialSheet"],
  initialDay?: DayOfWeek
): ActiveSheet {
  switch (initialSheet) {
    case "picker":
      return { type: "picker", mode: "dish", meal: "breakfast" };
    case "snack":
      return { type: "picker", mode: "snack", meal: "lunch" };
    case "share":
      return { type: "share" };
    case "form":
      return { type: "form" };
    case "more":
      return { type: "more" };
    case "edit":
      return {
        type: "edit",
        day: initialDay ?? "monday",
        meal: "breakfast",
        dishId: "idli",
      };
    default:
      return null;
  }
}

export function MealApp({
  dishRepo,
  planRepo,
  listScope = "default",
  inviteCode,
  onSignOut,
  initialTab = "plan",
  initialDay,
  initialSheet = null,
  hideTabBar,
}: Props) {
  const monday = useMemo(() => startOfWeek(), []);
  const { recent, favorites, remember } = useDishLists(listScope);
  const [tab, setTab] = useState<AppTab>(initialTab);
  const [plan, setPlan] = useState<WeeklyPlan>(emptyWeeklyPlan);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    initialDay ?? todayDayOfWeek()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(() =>
    initialActiveSheet(initialSheet, initialDay)
  );
  const [cookOpen, setCookOpen] = useState(initialSheet === "cook");
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const picker = activeSheet?.type === "picker" ? activeSheet : null;
  const edit = activeSheet?.type === "edit" ? activeSheet : null;
  const formOpen = activeSheet?.type === "form";
  const editingDish = activeSheet?.type === "form" ? activeSheet.dish : undefined;
  const shareOpen = activeSheet?.type === "share";
  const moreOpen = activeSheet?.type === "more";
  const sheetOpen = activeSheet !== null;

  const load = useCallback(async () => {
    try {
      setError(null);
      const [loadedDishes, loadedPlan] = await Promise.all([
        dishRepo.getAll(),
        planRepo.get(),
      ]);
      setDishes(loadedDishes);
      setPlan(loadedPlan);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [dishRepo, planRepo]);

  useEffect(() => {
    load();
  }, [load]);

  const savePlan = async (next: WeeklyPlan) => {
    const previous = plan;
    setPlan(next);
    try {
      await planRepo.save(next);
    } catch (e) {
      setPlan(previous);
      throw e;
    }
  };

  const withBusy = async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setPickerError(null);
    try {
      await fn();
    } catch (e: unknown) {
      setPickerError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const slotTag = (state: NonNullable<typeof picker>): DishTag =>
    state.mode === "snack" ? "snack" : state.meal;

  const ensureMealTag = async (dish: Dish, tag: DishTag): Promise<Dish> => {
    if (dish.mealTypes.includes(tag)) return dish;
    const tagged = { ...dish, mealTypes: appendMealTag(dish.mealTypes, tag) };
    await dishRepo.save(tagged);
    setDishes((prev) => prev.map((item) => (item.id === dish.id ? tagged : item)));
    return tagged;
  };

  const handleTab = (next: AppTab) => {
    if (next === "more") {
      setActiveSheet({ type: "more" });
      return;
    }
    setTab(next);
    setCookOpen(false);
    setActiveSheet(null);
  };

  const handleConfirmPick = (dishId: string) => {
    if (!picker) return;
    const current = picker;
    void withBusy(async () => {
      const dish = dishes.find((item) => item.id === dishId);
      if (dish) await ensureMealTag(dish, slotTag(current));

      if (current.mode === "snack") {
        let next = plan;
        if (current.replaceId) {
          next = removeSnackFromMeal(next, selectedDay, current.meal, current.replaceId);
        }
        await savePlan(setSnackOnMeal(next, selectedDay, current.meal, dishId));
      } else {
        await savePlan(
          addDishToMeal(plan, selectedDay, current.meal, dishId, current.replaceId)
        );
      }
      remember(dishId);
      if (current.replaceId) {
        setActiveSheet(null);
      }
    });
  };

  const handleCreateDish = (name: string) => {
    if (!picker) return;
    const current = picker;
    const nameError = validateDishName(name);
    if (nameError) {
      setPickerError(nameError);
      return;
    }
    if (hasExactDishNameMatch(dishes, name)) return;

    void withBusy(async () => {
      const dish: Dish = {
        ...buildInlineDish(name, slotTag(current)),
        notes: normalizeDishNotes(null) ?? undefined,
      };
      await dishRepo.save(dish);
      setDishes((prev) => [...prev, dish]);
      if (current.mode === "snack") {
        await savePlan(setSnackOnMeal(plan, selectedDay, current.meal, dish.id));
      } else {
        await savePlan(addDishToMeal(plan, selectedDay, current.meal, dish.id));
      }
      remember(dish.id);
    });
  };

  const handleRemove = () => {
    if (!edit) return;
    const current = edit;
    void withBusy(async () => {
      const next = current.isSnack
        ? removeSnackFromMeal(plan, current.day, current.meal, current.dishId)
        : removeDishFromMeal(plan, current.day, current.meal, current.dishId);
      await savePlan(next);
      setActiveSheet(null);
    });
  };

  const handleSaveDish = async (dish: Dish) => {
    try {
      await dishRepo.save(dish);
      await load();
      setActiveSheet(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save dish");
    }
  };

  if (loading) {
    return <AppChromeSkeleton />;
  }
  if (error) {
    return <div className="error-state">{error}</div>;
  }

  const editDish = dishes.find((d) => d.id === edit?.dishId);

  return (
    <div className={`phone-shell${sheetOpen ? " sheet-open" : ""}`}>
      {cookOpen ? (
        <CookView
          plan={plan}
          dishes={dishes}
          monday={monday}
          onBack={() => setCookOpen(false)}
        />
      ) : tab === "dishes" ? (
        <DishLibrary
          dishes={dishes}
          onAdd={() => {
            setActiveSheet({ type: "form" });
          }}
          onEdit={(dish) => {
            setActiveSheet({ type: "form", dish });
          }}
        />
      ) : (
        <WeeklyPlanner
          plan={plan}
          dishes={dishes}
          selectedDay={selectedDay}
          monday={monday}
          onSelectDay={setSelectedDay}
          onAddDish={(meal) => {
            setPickerError(null);
            setActiveSheet({ type: "picker", mode: "dish", meal });
          }}
          onAttachSnack={(meal) => {
            setPickerError(null);
            setActiveSheet({ type: "picker", mode: "snack", meal });
          }}
          onEditDish={(target) => setActiveSheet({ type: "edit", ...target })}
          onShare={() => setActiveSheet({ type: "share" })}
        />
      )}

      {!hideTabBar && !cookOpen && (
        <TabBar tab={tab} onChange={handleTab} hidden={sheetOpen} />
      )}

      <DishPickerSheet
        open={!!picker}
        mode={picker?.mode === "snack" ? "snack" : "dish"}
        meal={picker?.meal ?? "breakfast"}
        dishes={dishes}
        recentIds={recent}
        favoriteIds={favorites}
        selectedIds={
          picker
            ? picker.mode === "snack"
              ? snackIds(plan[selectedDay], picker.meal)
              : mealIds(plan[selectedDay], picker.meal)
            : []
        }
        selectedId={picker?.replaceId}
        busy={busy}
        error={pickerError}
        onClose={() => {
          if (busyRef.current) return;
          setActiveSheet(null);
          setPickerError(null);
        }}
        onConfirm={handleConfirmPick}
        onCreateDish={handleCreateDish}
      />

      <EditRemoveSheet
        open={!!edit}
        dishName={editDish?.name ?? "Dish"}
        meal={edit?.meal ?? "breakfast"}
        dayLabel={formatCollapsedDay(monday, edit?.day ?? selectedDay)}
        isSnack={edit?.isSnack}
        onReplace={() => {
          if (!edit) return;
          setActiveSheet({
            type: "picker",
            mode: edit.isSnack ? "snack" : "replace",
            meal: edit.meal,
            replaceId: edit.dishId,
            isSnack: edit.isSnack,
          });
        }}
        onRemove={handleRemove}
        onClose={() => setActiveSheet(null)}
      />

      <ShareSheet
        open={shareOpen}
        plan={plan}
        dishes={dishes}
        day={selectedDay}
        monday={monday}
        onClose={() => setActiveSheet(null)}
        onOpenCookView={() => {
          setActiveSheet(null);
          setCookOpen(true);
        }}
      />

      <DishForm
        open={formOpen}
        initial={editingDish}
        onSave={handleSaveDish}
        onCancel={() => setActiveSheet(null)}
      />

      <MoreSheet
        open={moreOpen}
        inviteCode={inviteCode}
        onClose={() => setActiveSheet(null)}
        onSignOut={onSignOut}
        onOpenCookView={() => {
          setActiveSheet(null);
          setCookOpen(true);
        }}
      />
    </div>
  );
}
