"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { HouseholdProvider, useHousehold } from "@/hooks/useHousehold";
import { useSupabase } from "@/hooks/useSupabase";
import { createSupabaseDishRepo, createSupabasePlanRepo } from "@/data/supabaseRepo";
import { MealApp } from "@/components/MealApp";

function AppContent() {
  const { user, householdId, inviteCode, loading } = useHousehold();
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

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!householdId || !dishRepo || !planRepo) {
    router.push("/onboarding");
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
  return (
    <HouseholdProvider>
      <AppContent />
    </HouseholdProvider>
  );
}
