"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSupabase } from "./useSupabase";
import { User } from "@supabase/supabase-js";

type HouseholdState = {
  user: User | null;
  householdId: string | null;
  inviteCode: string | null;
  loading: boolean;
};

const HouseholdContext = createContext<HouseholdState>({
  user: null,
  householdId: null,
  inviteCode: null,
  loading: true,
});

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [state, setState] = useState<HouseholdState>({
    user: null,
    householdId: null,
    inviteCode: null,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ user: null, householdId: null, inviteCode: null, loading: false });
        return;
      }

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        setState({ user, householdId: null, inviteCode: null, loading: false });
        return;
      }

      const { data: household } = await supabase
        .from("households")
        .select("invite_code")
        .eq("id", membership.household_id)
        .single();

      setState({
        user,
        householdId: membership.household_id,
        inviteCode: household?.invite_code ?? null,
        loading: false,
      });
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <HouseholdContext.Provider value={state}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  return useContext(HouseholdContext);
}
