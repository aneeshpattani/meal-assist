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

type HouseholdRow = {
  id: string;
  invite_code: string;
};

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
      // RLS already scopes households to auth.uid() via user_household_ids(),
      // so membership + invite code collapse into one select, in parallel with
      // getUser(). Zero-migration: no RPC/view required.
      const [authResult, householdResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("households").select("id, invite_code").maybeSingle(),
      ]);
      if (timedOut) return;

      const user = authResult.data.user;
      if (authResult.error) throw authResult.error;

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

      if (householdResult.error) throw householdResult.error;
      const household = householdResult.data as HouseholdRow | null;

      setState({
        user,
        householdId: household?.id ?? null,
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
    // onAuthStateChange emits INITIAL_SESSION on subscribe, so this is the
    // single load path — do not also call load() here or first paint doubles.
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
