import {
  householdErrorMessage,
  isMissingAuthSession,
  loadHouseholdForSession,
} from "../src/data/householdSession.ts";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function assert(condition, label) {
  if (!condition) fail(label);
}

function assertEqual(actual, expected, label) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) fail(`${label}: expected ${right}, got ${left}`);
}

function missingSessionError(overrides = {}) {
  const error = new Error("Auth session missing!");
  error.name = "AuthSessionMissingError";
  error.status = 400;
  Object.assign(error, overrides);
  return error;
}

function unusedHouseholdFetch() {
  return async () => {
    fail("fetchHousehold should not run for a signed-out session");
    return { data: null, error: null };
  };
}

assert(isMissingAuthSession(missingSessionError()), "name AuthSessionMissingError");
assert(
  isMissingAuthSession({ status: 400, message: "Auth session missing!" }),
  "status 400 + missing session message"
);
assert(
  isMissingAuthSession({ message: "Auth session missing!" }),
  "message-only missing session"
);
assert(!isMissingAuthSession(null), "null is not a missing session");
assert(
  !isMissingAuthSession(new Error("Failed to fetch")),
  "network errors are not missing sessions"
);
assert(
  !isMissingAuthSession({ status: 500, message: "Internal server error" }),
  "500 is not a missing session"
);
assertEqual(
  householdErrorMessage(new Error("Failed to fetch")),
  "Failed to fetch",
  "preserve genuine error messages"
);

const user = { id: "user-1" };
const household = { id: "hh-1", invite_code: "HOME12AB" };

{
  const result = await loadHouseholdForSession({
    session: null,
    getUser: async () => {
      fail("getUser should not run when session is null");
      return { data: { user: null }, error: null };
    },
    fetchHousehold: unusedHouseholdFetch(),
  });
  assertEqual(result, { status: "signed-out" }, "null session is signed-out");
}

{
  const result = await loadHouseholdForSession({
    getUser: async () => ({ data: { user: null }, error: missingSessionError() }),
    fetchHousehold: unusedHouseholdFetch(),
  });
  assertEqual(
    result,
    { status: "signed-out" },
    "AuthSessionMissingError from getUser is signed-out"
  );
}

{
  const result = await loadHouseholdForSession({
    getUser: async () => ({
      data: { user: null },
      error: { status: 400, message: "Auth session missing!" },
    }),
    fetchHousehold: unusedHouseholdFetch(),
  });
  assertEqual(
    result,
    { status: "signed-out" },
    "status 400 missing session from getUser is signed-out"
  );
}

{
  const result = await loadHouseholdForSession({
    getUser: async () => ({ data: { user: null }, error: null }),
    fetchHousehold: unusedHouseholdFetch(),
  });
  assertEqual(result, { status: "signed-out" }, "!user with no error is signed-out");
}

{
  const result = await loadHouseholdForSession({
    getUser: async () => ({
      data: { user: null },
      error: new Error("Failed to fetch"),
    }),
    fetchHousehold: unusedHouseholdFetch(),
  });
  assertEqual(
    result,
    { status: "error", message: "Failed to fetch" },
    "genuine getUser network errors still surface"
  );
}

{
  let fetched = false;
  const result = await loadHouseholdForSession({
    session: { user },
    getUser: async () => {
      fail("getUser should not run when session already has a user");
      return { data: { user: null }, error: null };
    },
    fetchHousehold: async () => {
      fetched = true;
      return { data: household, error: null };
    },
  });
  assert(fetched, "signed-in session fetches household");
  assertEqual(
    result,
    {
      status: "signed-in",
      user,
      householdId: "hh-1",
      inviteCode: "HOME12AB",
    },
    "signed-in session returns household"
  );
}

{
  const result = await loadHouseholdForSession({
    getUser: async () => ({ data: { user }, error: null }),
    fetchHousehold: async () => ({
      data: null,
      error: new Error("permission denied"),
    }),
  });
  assertEqual(
    result,
    { status: "error", message: "permission denied" },
    "household query errors still surface for signed-in users"
  );
}

console.log("OK: household session missing-auth and signed-out handling");
