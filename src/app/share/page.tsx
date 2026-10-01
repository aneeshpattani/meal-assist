"use client";

import { useEffect, useMemo, useState } from "react";
import { HouseholdProvider, useHousehold } from "@/hooks/useHousehold";
import { useSupabase } from "@/hooks/useSupabase";
import { createSupabaseDishRepo, createSupabasePlanRepo } from "@/data/supabaseRepo";
import { CookView } from "@/components/CookView";
import { Dish, WeeklyPlan, emptyWeeklyPlan } from "@/domain/types";
import { startOfWeek } from "@/domain/plan";
import { useRouter } from "next/navigation";

function ShareContent() {
  const { user, householdId, loading } = useHousehold();
  const supabase = useSupabase();
  const router = useRouter();
  const monday = useMemo(() => startOfWeek(), []);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan>(emptyWeeklyPlan);
  const [ready, setReady] = useState(false);

  const dishRepo = useMemo(
    () => (householdId ? createSupabaseDishRepo(supabase, householdId) : null),
    [supabase, householdId]
  );
  const planRepo = useMemo(
    () => (householdId ? createSupabasePlanRepo(supabase, householdId) : null),
    [supabase, householdId]
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!householdId || !dishRepo || !planRepo) {
      router.push("/onboarding");
      return;
    }
    Promise.all([dishRepo.getAll(), planRepo.get()]).then(([d, p]) => {
      setDishes(d);
      setPlan(p);
      setReady(true);
    });
  }, [loading, user, householdId, dishRepo, planRepo, router]);

  if (!ready) return <div className="loading-state">Loading cook plan…</div>;

  return (
    <div className="phone-shell">
      <CookView
        plan={plan}
        dishes={dishes}
        monday={monday}
        onBack={() => router.push("/")}
      />
    </div>
  );
}

export default function SharePage() {
  return (
    <HouseholdProvider>
      <ShareContent />
    </HouseholdProvider>
  );
}
