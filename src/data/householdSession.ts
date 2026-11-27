export const SIGNED_OUT_HOUSEHOLD = {
  user: null,
  householdId: null,
  inviteCode: null,
  loading: false,
  error: null,
} as const;

export type HouseholdRow = {
  id: string;
  invite_code: string | null;
};

export type HouseholdLoadResult<TUser> =
  | { status: "signed-out" }
  | {
      status: "signed-in";
      user: TUser;
      householdId: string | null;
      inviteCode: string | null;
    }
  | { status: "error"; message: string };

export function isMissingAuthSession(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const err = error as { name?: unknown; message?: unknown; status?: unknown };
  if (err.name === "AuthSessionMissingError") return true;
  const message = typeof err.message === "string" ? err.message : "";
  if (/auth session missing/i.test(message)) return true;
  if (err.status === 400 && /session missing/i.test(message)) return true;
  return false;
}

export function householdErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Couldn't load your household. Please try again.";
}

type AuthResult<TUser> = {
  data: { user: TUser | null };
  error: unknown;
};

type HouseholdResult = {
  data: HouseholdRow | null;
  error: unknown;
};

/**
 * Resolve household state for a known auth session, a refresh with no session
 * argument, or an explicit signed-out session (`null`).
 *
 * `session === null` skips both getUser and the households query.
 * A missing-session error from getUser is signed-out, not a UI error.
 */
export async function loadHouseholdForSession<TUser>(args: {
  session?: { user: TUser } | null;
  getUser: () => Promise<AuthResult<TUser>>;
  fetchHousehold: () => Promise<HouseholdResult>;
}): Promise<HouseholdLoadResult<TUser>> {
  if (args.session === null) {
    return { status: "signed-out" };
  }

  let user: TUser | null = args.session?.user ?? null;
  if (!user) {
    const authResult = await args.getUser();
    if (authResult.error && !isMissingAuthSession(authResult.error)) {
      return { status: "error", message: householdErrorMessage(authResult.error) };
    }
    user = authResult.data.user;
    if (!user || isMissingAuthSession(authResult.error)) {
      return { status: "signed-out" };
    }
  }

  const householdResult = await args.fetchHousehold();
  if (householdResult.error) {
    return { status: "error", message: householdErrorMessage(householdResult.error) };
  }

  return {
    status: "signed-in",
    user,
    householdId: householdResult.data?.id ?? null,
    inviteCode: householdResult.data?.invite_code ?? null,
  };
}
