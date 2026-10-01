"use client";

import { useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { HouseholdProvider, useHousehold } from "@/hooks/useHousehold";
import { useRouter } from "next/navigation";

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function OnboardingContent() {
  const supabase = useSupabase();
  const { user } = useHousehold();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [householdName, setHouseholdName] = useState("Home");
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    setError("");
    setLoading(true);

    const inviteCode = generateInviteCode();
    const { data: household, error: createErr } = await supabase
      .from("households")
      .insert({ name: householdName, invite_code: inviteCode })
      .select("id")
      .single();

    if (createErr) {
      setError(createErr.message);
      setLoading(false);
      return;
    }

    const { error: memberErr } = await supabase
      .from("household_members")
      .insert({ household_id: household.id, user_id: user.id });

    if (memberErr) {
      setError(memberErr.message);
      setLoading(false);
      return;
    }

    // Seed default dishes
    await supabase.from("dishes").insert([
      {
        id: "poha",
        household_id: household.id,
        name: "Poha",
        meal_types: ["breakfast"],
        ingredients: [
          { id: "poha", name: "Poha" },
          { id: "onion", name: "Onion" },
          { id: "peanuts", name: "Peanuts" },
          { id: "green-chilli", name: "Green Chilli" },
          { id: "curry-leaves", name: "Curry Leaves" },
        ],
      },
      {
        id: "chicken-curry",
        household_id: household.id,
        name: "Chicken Curry",
        meal_types: ["lunch", "dinner"],
        ingredients: [
          { id: "chicken", name: "Chicken" },
          { id: "onion", name: "Onion" },
          { id: "tomato", name: "Tomato" },
          { id: "garlic", name: "Garlic" },
          { id: "ginger", name: "Ginger" },
        ],
      },
    ]);

    // Seed empty plan
    await supabase.from("weekly_plans").insert({
      household_id: household.id,
      plan: {},
    });

    setLoading(false);
    router.push("/");
  };

  const handleJoin = async () => {
    if (!user) return;
    setError("");
    setLoading(true);

    const code = inviteInput.trim().toUpperCase();
    const { data: household, error: findErr } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", code)
      .maybeSingle();

    if (findErr || !household) {
      setError("Invalid invite code. Please check and try again.");
      setLoading(false);
      return;
    }

    const { error: memberErr } = await supabase
      .from("household_members")
      .insert({ household_id: household.id, user_id: user.id });

    if (memberErr) {
      setError(memberErr.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
  };

  if (mode === "choose") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Set Up Your Household</h1>
          <p>Create a new household or join an existing one with an invite code.</p>
          <div className="onboarding-choices">
            <button className="btn btn-primary" onClick={() => setMode("create")}>
              Create Household
            </button>
            <button className="btn btn-secondary" onClick={() => setMode("join")}>
              Join with Invite Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Create Household</h1>
          <div className="form-field">
            <label>Household Name</label>
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. Home"
            />
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn-ghost" onClick={() => setMode("choose")}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Join Household</h1>
        <div className="form-field">
          <label>Invite Code</label>
          <input
            type="text"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="e.g. ABC123"
            autoFocus
          />
        </div>
        <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
          {loading ? "Joining..." : "Join"}
        </button>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn-ghost" onClick={() => setMode("choose")}>Back</button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <HouseholdProvider>
      <OnboardingContent />
    </HouseholdProvider>
  );
}
