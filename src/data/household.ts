import { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase/client";

export const HOUSEHOLD_NAME_MAX_LENGTH = 80;
export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_PATTERN = new RegExp(
  `^[${INVITE_CODE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`
);

export const MISSING_SUPABASE_CONFIG_MESSAGE =
  "This app is not connected to Supabase yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

/** Postgres SQLSTATE values raised by create_household / join_household. */
export const HOUSEHOLD_SQLSTATE = {
  not_authenticated: "28000",
  invalid_invite: "P2201",
  already_member: "P2202",
  invalid_name: "P2203",
  invite_unavailable: "P2204",
  seed_failed: "P2205",
} as const;

export type HouseholdErrorCode = keyof typeof HOUSEHOLD_SQLSTATE | "unknown";

const HOUSEHOLD_ERROR_MESSAGES: Record<HouseholdErrorCode, string> = {
  not_authenticated: "Please sign in again and retry.",
  invalid_invite: "Invalid invite code. Please check and try again.",
  already_member: "You already belong to a household.",
  invalid_name: `Enter a household name between 1 and ${HOUSEHOLD_NAME_MAX_LENGTH} characters.`,
  invite_unavailable: "Could not allocate an invite code. Please try again.",
  seed_failed: "Could not seed the starter dish catalog. Please try again.",
  unknown: "Something went wrong. Please try again.",
};

export type HouseholdRecord = {
  id: string;
  invite_code: string;
};

export class HouseholdError extends Error {
  readonly code: HouseholdErrorCode;
  readonly sqlState: string | null;

  constructor(code: HouseholdErrorCode, sqlState: string | null = null) {
    super(HOUSEHOLD_ERROR_MESSAGES[code]);
    this.name = "HouseholdError";
    this.code = code;
    this.sqlState = sqlState;
  }
}

function sqlStateToCode(sqlState: string, message: string): HouseholdErrorCode {
  for (const [code, state] of Object.entries(HOUSEHOLD_SQLSTATE) as [
    Exclude<HouseholdErrorCode, "unknown">,
    string,
  ][]) {
    if (sqlState === state || message === code) return code;
  }
  return "unknown";
}

export function householdErrorFromUnknown(
  error: unknown,
  fallback: HouseholdErrorCode = "unknown"
): HouseholdError {
  if (error instanceof HouseholdError) return error;
  const sqlState =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code ?? "")
      : "";
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message ?? "")
      : "";
  const code = sqlStateToCode(sqlState, message);
  return new HouseholdError(code === "unknown" ? fallback : code, sqlState || null);
}

export function normalizeHouseholdName(name: string): string {
  return name.trim();
}

export function validateHouseholdName(name: string): HouseholdError | null {
  const normalized = normalizeHouseholdName(name);
  if (
    normalized.length === 0 ||
    normalized.length > HOUSEHOLD_NAME_MAX_LENGTH
  ) {
    return new HouseholdError("invalid_name");
  }
  return null;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateInviteCode(code: string): HouseholdError | null {
  if (!INVITE_CODE_PATTERN.test(normalizeInviteCode(code))) {
    return new HouseholdError("invalid_invite");
  }
  return null;
}

function asHouseholdRecord(data: unknown): HouseholdRecord {
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as HouseholdRecord).id !== "string" ||
    typeof (data as HouseholdRecord).invite_code !== "string"
  ) {
    throw new HouseholdError("unknown");
  }
  return data as HouseholdRecord;
}

function assertSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error(MISSING_SUPABASE_CONFIG_MESSAGE);
  }
}

export async function createHousehold(
  supabase: SupabaseClient,
  name: string
): Promise<HouseholdRecord> {
  assertSupabaseConfig();
  const nameError = validateHouseholdName(name);
  if (nameError) throw nameError;

  const { data, error } = await supabase.rpc("create_household", {
    p_name: normalizeHouseholdName(name),
  });
  if (error) throw householdErrorFromUnknown(error, "unknown");
  return asHouseholdRecord(data);
}

export async function joinHousehold(
  supabase: SupabaseClient,
  inviteCode: string
): Promise<HouseholdRecord> {
  assertSupabaseConfig();
  const codeError = validateInviteCode(inviteCode);
  if (codeError) throw codeError;

  const { data, error } = await supabase.rpc("join_household", {
    p_invite_code: normalizeInviteCode(inviteCode),
  });
  if (error) throw householdErrorFromUnknown(error, "invalid_invite");
  return asHouseholdRecord(data);
}
