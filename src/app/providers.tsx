"use client";

import { ReactNode } from "react";
import { HouseholdProvider } from "@/hooks/useHousehold";

export function AppProviders({ children }: { children: ReactNode }) {
  return <HouseholdProvider>{children}</HouseholdProvider>;
}
