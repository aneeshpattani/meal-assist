"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useHousehold } from "@/hooks/useHousehold";
import { useRouter } from "next/navigation";
import {
  HOUSEHOLD_NAME_MAX_LENGTH,
  INVITE_CODE_LENGTH,
  MISSING_SUPABASE_CONFIG_MESSAGE,
  createHousehold,
  householdErrorFromUnknown,
  joinHousehold,
  validateHouseholdName,
  validateInviteCode,
} from "@/data/household";
import { hasSupabaseConfig } from "@/lib/supabase/client";

function OnboardingContent() {
  const supabase = useSupabase();
  const { user, householdId, loading: householdLoading, error: householdError, refresh } =
    useHousehold();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [householdName, setHouseholdName] = useState("Home");
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (householdLoading) return;
    if (householdError) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (householdId) {
      router.replace("/");
    }
  }, [householdLoading, householdError, user, householdId, router]);

  const handleCreate = async () => {
    if (!user) return;
    setError("");

    if (!hasSupabaseConfig()) {
      setError(MISSING_SUPABASE_CONFIG_MESSAGE);
      return;
    }

    const nameError = validateHouseholdName(householdName);
    if (nameError) {
      setError(nameError.message);
      return;
    }

    setLoading(true);
    try {
      await createHousehold(supabase, householdName);
      await refresh();
      router.replace("/");
    } catch (e: unknown) {
      setError(householdErrorFromUnknown(e).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    setError("");

    if (!hasSupabaseConfig()) {
      setError(MISSING_SUPABASE_CONFIG_MESSAGE);
      return;
    }

    const codeError = validateInviteCode(inviteInput);
    if (codeError) {
      setError(codeError.message);
      return;
    }

    setLoading(true);
    try {
      await joinHousehold(supabase, inviteInput);
      await refresh();
      router.replace("/");
    } catch (e: unknown) {
      setError(householdErrorFromUnknown(e, "invalid_invite").message);
    } finally {
      setLoading(false);
    }
  };

  if (householdLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (householdError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Could not load household</h1>
          <p className="auth-error">{householdError}</p>
          <button className="btn btn-primary" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user || householdId) {
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
              maxLength={HOUSEHOLD_NAME_MAX_LENGTH}
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
            placeholder="e.g. ABCD2345"
            autoFocus
            maxLength={INVITE_CODE_LENGTH + 8}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
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
  return <OnboardingContent />;
}
