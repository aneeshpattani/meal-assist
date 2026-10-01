"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DayOfWeek,
  Dish,
  MealType,
  WeeklyPlan,
  emptyWeeklyPlan,
} from "@/domain/types";
import {
  addDishToMeal,
  formatCollapsedDay,
  removeDishFromMeal,
  removeSnackFromMeal,
  setSnackOnMeal,
  startOfWeek,
  todayDayOfWeek,
} from "@/domain/plan";
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

type PickerMode = "dish" | "snack" | "replace";

type PickerState = {
  mode: PickerMode;
  meal: MealType;
  replaceId?: string;
  isSnack?: boolean;
};

type EditState = {
  day: DayOfWeek;
  meal: MealType;
  dishId: string;
  isSnack?: boolean;
};

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
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | undefined>();
  const [cookOpen, setCookOpen] = useState(false);

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

  useEffect(() => {
    if (!initialSheet) return;
    if (initialSheet === "picker") setPicker({ mode: "dish", meal: "breakfast" });
    if (initialSheet === "snack") setPicker({ mode: "snack", meal: "lunch" });
    if (initialSheet === "share") setShareOpen(true);
    if (initialSheet === "form") setFormOpen(true);
    if (initialSheet === "more") setMoreOpen(true);
    if (initialSheet === "cook") setCookOpen(true);
    if (initialSheet === "edit") {
      setEdit({
        day: initialDay ?? todayDayOfWeek(),
        meal: "breakfast",
        dishId: "idli",
      });
    }
  }, [initialSheet, initialDay]);

  const savePlan = async (next: WeeklyPlan) => {
    setPlan(next);
    await planRepo.save(next);
  };

  const handleTab = (next: AppTab) => {
    if (next === "more") {
      setMoreOpen(true);
      return;
    }
    setTab(next);
    setCookOpen(false);
  };

  const handleConfirmPick = async (dishId: string) => {
    if (!picker) return;
    if (picker.mode === "snack") {
      let next = plan;
      if (picker.replaceId) {
        next = removeSnackFromMeal(next, selectedDay, picker.meal, picker.replaceId);
      }
      await savePlan(setSnackOnMeal(next, selectedDay, picker.meal, dishId));
    } else {
      await savePlan(
        addDishToMeal(plan, selectedDay, picker.meal, dishId, picker.replaceId)
      );
    }
    remember(dishId);
    setPicker(null);
    setEdit(null);
  };

  const handleRemove = async () => {
    if (!edit) return;
    const next = edit.isSnack
      ? removeSnackFromMeal(plan, edit.day, edit.meal, edit.dishId)
      : removeDishFromMeal(plan, edit.day, edit.meal, edit.dishId);
    await savePlan(next);
    setEdit(null);
  };

  const handleSaveDish = async (dish: Dish) => {
    await dishRepo.save(dish);
    await load();
    setFormOpen(false);
    setEditingDish(undefined);
  };

  if (loading) {
    return <div className="loading-state">Loading…</div>;
  }
  if (error) {
    return <div className="error-state">{error}</div>;
  }

  const editDish = dishes.find((d) => d.id === edit?.dishId);

  return (
    <div className="phone-shell">
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
            setEditingDish(undefined);
            setFormOpen(true);
          }}
          onEdit={(dish) => {
            setEditingDish(dish);
            setFormOpen(true);
          }}
        />
      ) : (
        <WeeklyPlanner
          plan={plan}
          dishes={dishes}
          selectedDay={selectedDay}
          monday={monday}
          onSelectDay={setSelectedDay}
          onAddDish={(meal) => setPicker({ mode: "dish", meal })}
          onAttachSnack={(meal) => setPicker({ mode: "snack", meal })}
          onEditDish={setEdit}
          onShare={() => setShareOpen(true)}
        />
      )}

      {!hideTabBar && !cookOpen && <TabBar tab={tab} onChange={handleTab} />}

      <DishPickerSheet
        key={`${picker?.mode}-${picker?.meal}-${picker?.replaceId ?? ""}`}
        open={!!picker}
        mode={picker?.mode === "snack" ? "snack" : "dish"}
        meal={picker?.meal ?? "breakfast"}
        dishes={dishes}
        recentIds={recent}
        favoriteIds={favorites}
        selectedId={picker?.replaceId}
        onClose={() => setPicker(null)}
        onConfirm={handleConfirmPick}
        onCreate={() => {
          setPicker(null);
          setEditingDish(undefined);
          setFormOpen(true);
        }}
      />

      <EditRemoveSheet
        open={!!edit}
        dishName={editDish?.name ?? "Dish"}
        meal={edit?.meal ?? "breakfast"}
        dayLabel={formatCollapsedDay(monday, edit?.day ?? selectedDay)}
        isSnack={edit?.isSnack}
        onReplace={() => {
          if (!edit) return;
          setPicker({
            mode: edit.isSnack ? "snack" : "replace",
            meal: edit.meal,
            replaceId: edit.dishId,
            isSnack: edit.isSnack,
          });
          setEdit(null);
        }}
        onRemove={handleRemove}
        onClose={() => setEdit(null)}
      />

      <ShareSheet
        open={shareOpen}
        plan={plan}
        dishes={dishes}
        day={selectedDay}
        monday={monday}
        onClose={() => setShareOpen(false)}
        onOpenCookView={() => {
          setShareOpen(false);
          setCookOpen(true);
        }}
      />

      <DishForm
        key={editingDish?.id ?? (formOpen ? "new" : "closed")}
        open={formOpen}
        initial={editingDish}
        onSave={handleSaveDish}
        onCancel={() => {
          setFormOpen(false);
          setEditingDish(undefined);
        }}
      />

      <MoreSheet
        open={moreOpen}
        inviteCode={inviteCode}
        onClose={() => setMoreOpen(false)}
        onSignOut={onSignOut}
        onOpenCookView={() => {
          setMoreOpen(false);
          setCookOpen(true);
        }}
      />
    </div>
  );
}
