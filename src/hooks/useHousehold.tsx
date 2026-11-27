"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { useSupabase } from "./useSupabase";
import { MISSING_SUPABASE_CONFIG_MESSAGE } from "@/data/household";
import {
  SIGNED_OUT_HOUSEHOLD,
  loadHouseholdForSession,
} from "@/data/householdSession";
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

  const load = useCallback(
    async (session?: Session | null) => {
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

      if (session === null) {
        setState({ ...SIGNED_OUT_HOUSEHOLD });
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
        const result = await loadHouseholdForSession({
          session,
          getUser: () => supabase.auth.getUser(),
          fetchHousehold: () =>
            supabase.from("households").select("id, invite_code").maybeSingle(),
        });
        if (timedOut) return;

        if (result.status === "signed-out") {
          setState({ ...SIGNED_OUT_HOUSEHOLD });
          return;
        }
        if (result.status === "error") {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: result.message,
          }));
          return;
        }

        setState({
          user: result.user,
          householdId: result.householdId,
          inviteCode: result.inviteCode,
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
    },
    [supabase]
  );

  useEffect(() => {
    // onAuthStateChange emits INITIAL_SESSION on subscribe, so this is the
    // single load path — do not also call load() here or first paint doubles.
    const {
      data: { subscription },
    } =       supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      void load(session);
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
