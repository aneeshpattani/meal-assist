"use client";

import { useState } from "react";
import { DishLibrary } from "@/components/DishLibrary";
import { WeeklyPlanner } from "@/components/WeeklyPlanner";
import { useHousehold } from "@/hooks/useHousehold";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/useSupabase";

type Tab = "dishes" | "planner";

function AppContent() {
  const { user, householdId, inviteCode, loading, error, refresh } = useHousehold();
  const router = useRouter();
  const supabase = useSupabase();
  const [tab, setTab] = useState<Tab>("dishes");

  if (loading) {
    return (
      <div className="app">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => void refresh()}>
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

  if (!householdId) {
    router.replace("/onboarding");
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meal Assist</h1>
        <nav className="tab-nav">
          <button
            className={`tab-btn ${tab === "dishes" ? "active" : ""}`}
            onClick={() => setTab("dishes")}
          >
            Dish Library
          </button>
          <button
            className={`tab-btn ${tab === "planner" ? "active" : ""}`}
            onClick={() => setTab("planner")}
          >
            Weekly Planner
          </button>
        </nav>
      </header>
      <main className="app-main">
        {tab === "dishes" ? (
          <DishLibrary householdId={householdId} />
        ) : (
          <WeeklyPlanner householdId={householdId} />
        )}
      </main>
      <footer className="app-footer">
        {inviteCode && (
          <span className="invite-code">Invite code: <strong>{inviteCode}</strong></span>
        )}
        <button className="btn-ghost" onClick={handleSignOut}>Sign out</button>
      </footer>
    </div>
  );
}

export default function Home() {
  return <AppContent />;
}
