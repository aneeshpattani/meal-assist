"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useHousehold } from "@/hooks/useHousehold";
import { useSupabase } from "@/hooks/useSupabase";
import { createSupabaseDishRepo, createSupabasePlanRepo } from "@/data/supabaseRepo";
import { MealApp } from "@/components/MealApp";

function AppContent() {
  const { user, householdId, inviteCode, loading, error, refresh } = useHousehold();
  const router = useRouter();
  const supabase = useSupabase();

  const dishRepo = useMemo(
    () => (householdId ? createSupabaseDishRepo(supabase, householdId) : null),
    [supabase, householdId]
  );
  const planRepo = useMemo(
    () => (householdId ? createSupabasePlanRepo(supabase, householdId) : null),
    [supabase, householdId]
  );

  if (loading) {
    return <div className="loading-state">Loading…</div>;
  }

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

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (!householdId || !dishRepo || !planRepo) {
    router.replace("/onboarding");
    return null;
  }

  return (
    <MealApp
      dishRepo={dishRepo}
      planRepo={planRepo}
      listScope={householdId}
      inviteCode={inviteCode}
      onSignOut={async () => {
        await supabase.auth.signOut();
        router.push("/login");
      }}
    />
  );
}

export default function Home() {
  return <AppContent />;
}
