"use client";

import { useEffect, useMemo, useState } from "react";
import { useHousehold } from "@/hooks/useHousehold";
import { useSupabase } from "@/hooks/useSupabase";
import { createSupabaseDishRepo, createSupabasePlanRepo } from "@/data/supabaseRepo";
import { CookView } from "@/components/CookView";
import { Dish, WeeklyPlan, emptyWeeklyPlan } from "@/domain/types";
import { startOfWeek } from "@/domain/plan";
import { useRouter } from "next/navigation";

function ShareContent() {
  const { user, householdId, loading, error, refresh } = useHousehold();
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
    if (loading || error) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!householdId || !dishRepo || !planRepo) {
      router.replace("/onboarding");
      return;
    }
    Promise.all([dishRepo.getAll(), planRepo.get()]).then(([d, p]) => {
      setDishes(d);
      setPlan(p);
      setReady(true);
    });
  }, [loading, error, user, householdId, dishRepo, planRepo, router]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-error">{error}</p>
          <button className="btn btn-primary" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

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
  return <ShareContent />;
}
