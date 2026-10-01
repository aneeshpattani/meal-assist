"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MealApp } from "@/components/MealApp";
import { createLinkedMemoryRepos } from "@/data/memoryRepo";
import { DEMO_DISHES, demoFilledPlan } from "@/data/demoSeed";
import { emptyWeeklyPlan } from "@/domain/types";
import { AppTab } from "@/components/TabBar";

function PreviewInner() {
  const params = useSearchParams();
  const empty = params.get("empty") === "1";
  const tab = (params.get("tab") as AppTab) || "plan";
  const sheet = params.get("sheet") as
    | "picker"
    | "snack"
    | "share"
    | "edit"
    | "form"
    | "more"
    | "cook"
    | null;

  const { dishRepo, planRepo } = useMemo(
    () =>
      createLinkedMemoryRepos(
        DEMO_DISHES,
        empty ? emptyWeeklyPlan() : demoFilledPlan()
      ),
    [empty]
  );

  return (
    <MealApp
      dishRepo={dishRepo}
      planRepo={planRepo}
      listScope="preview"
      inviteCode="HOME12"
      initialTab={tab === "more" ? "plan" : tab}
      initialDay="monday"
      initialSheet={sheet}
    />
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="loading-state">Loading preview…</div>}>
      <PreviewInner />
    </Suspense>
  );
}
