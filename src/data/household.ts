import { SupabaseClient } from "@supabase/supabase-js";

export type HouseholdRecord = {
  id: string;
  invite_code: string;
};

function asHouseholdRecord(data: unknown): HouseholdRecord {
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as HouseholdRecord).id !== "string" ||
    typeof (data as HouseholdRecord).invite_code !== "string"
  ) {
    throw new Error("Household RPC returned no data");
  }
  return data as HouseholdRecord;
}

export function householdRpcMessage(
  error: { message?: string } | null | undefined,
  fallback: string
): string {
  const message = error?.message ?? "";
  if (/invalid invite code/i.test(message)) {
    return "Invalid invite code. Please check and try again.";
  }
  if (/not authenticated/i.test(message)) {
    return "Please sign in again and retry.";
  }
  if (/already a member/i.test(message)) {
    return "You already belong to a household.";
  }
  return message || fallback;
}

export async function createHousehold(
  supabase: SupabaseClient,
  name: string
): Promise<HouseholdRecord> {
  const { data, error } = await supabase.rpc("create_household", {
    p_name: name.trim() || "Home",
  });
  if (error) throw error;
  return asHouseholdRecord(data);
}

export async function joinHousehold(
  supabase: SupabaseClient,
  inviteCode: string
): Promise<HouseholdRecord> {
  const { data, error } = await supabase.rpc("join_household", {
    p_invite_code: inviteCode.trim().toUpperCase(),
  });
  if (error) throw error;
  return asHouseholdRecord(data);
}
