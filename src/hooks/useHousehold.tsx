"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSupabase } from "./useSupabase";
import { User } from "@supabase/supabase-js";
import {
  MISSING_SUPABASE_CONFIG_MESSAGE,
} from "@/data/household";
import { hasSupabaseConfig } from "@/lib/supabase/client";

const LOAD_TIMEOUT_MS = 15000;

type HouseholdState = {
  user: User | null;
  householdId: string | null;
  inviteCode: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdState>({
  user: null,
  householdId: null,
  inviteCode: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [state, setState] = useState<Omit<HouseholdState, "refresh">>({
    user: null,
    householdId: null,
    inviteCode: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!hasSupabaseConfig()) {
      setState({
        user: null,
        householdId: null,
        inviteCode: null,
        loading: false,
        error: MISSING_SUPABASE_CONFIG_MESSAGE,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          "Couldn't load your household. Check your connection and try again.",
      }));
    }, LOAD_TIMEOUT_MS);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (timedOut) return;

      if (!user) {
        setState({
          user: null,
          householdId: null,
          inviteCode: null,
          loading: false,
          error: null,
        });
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (timedOut) return;
      if (membershipError) throw membershipError;

      if (!membership) {
        setState({
          user,
          householdId: null,
          inviteCode: null,
          loading: false,
          error: null,
        });
        return;
      }

      const { data: household, error: householdError } = await supabase
        .from("households")
        .select("invite_code")
        .eq("id", membership.household_id)
        .single();
      if (timedOut) return;
      if (householdError) throw householdError;

      setState({
        user,
        householdId: membership.household_id,
        inviteCode: household?.invite_code ?? null,
        loading: false,
        error: null,
      });
    } catch (error) {
      if (timedOut) return;
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't load your household. Please try again.";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    } finally {
      window.clearTimeout(timer);
    }
  }, [supabase]);

  useEffect(() => {
    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, [load, supabase]);

  return (
    <HouseholdContext.Provider value={{ ...state, refresh: load }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  return useContext(HouseholdContext);
}
