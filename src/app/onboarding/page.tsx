"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { HouseholdProvider, useHousehold } from "@/hooks/useHousehold";
import { useRouter } from "next/navigation";
import {
  createHousehold,
  householdRpcMessage,
  joinHousehold,
} from "@/data/household";

function OnboardingContent() {
  const supabase = useSupabase();
  const { user, householdId, loading: householdLoading } = useHousehold();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [householdName, setHouseholdName] = useState("Home");
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (householdLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (householdId) {
      router.replace("/");
    }
  }, [householdLoading, user, householdId, router]);

  const handleCreate = async () => {
    if (!user) return;
    setError("");
    setLoading(true);

    try {
      await createHousehold(supabase, householdName);
      router.push("/");
    } catch (e: unknown) {
      setError(
        householdRpcMessage(
          e && typeof e === "object" ? (e as { message?: string }) : null,
          "Could not create household."
        )
      );
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    setError("");
    setLoading(true);

    try {
      await joinHousehold(supabase, inviteInput);
      router.push("/");
    } catch (e: unknown) {
      setError(
        householdRpcMessage(
          e && typeof e === "object" ? (e as { message?: string }) : null,
          "Invalid invite code. Please check and try again."
        )
      );
      setLoading(false);
    }
  };

  if (householdLoading || !user || householdId) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
