import {
  DISH_NAME_MAX_LENGTH,
  appendMealTag,
  buildInlineDish,
  dishNameKey,
  dishNeedsDetails,
  filterDishesForPicker,
  hasExactDishNameMatch,
  normalizeDishName,
  shouldShowCreateRow,
  validateDishName,
} from "../src/domain/dishPicker.ts";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function assertEqual(actual, expected, label) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) fail(`${label}: expected ${right}, got ${left}`);
}

function assert(condition, label) {
  if (!condition) fail(label);
}

const dishes = [
  { id: "poha", name: "Poha", mealTypes: ["breakfast"] },
  { id: "aloo-gobi", name: "Aloo Gobi", mealTypes: ["lunch", "dinner"] },
  { id: "chicken-curry", name: "Chicken Curry", mealTypes: ["dinner"] },
];

assertEqual(normalizeDishName("  Chicken   Curry  "), "Chicken Curry", "collapse whitespace");
assertEqual(normalizeDishName("\tPoha\n"), "Poha", "trim tabs and newlines");
assertEqual(dishNameKey("  CHICKEN   curry "), "chicken curry", "name key is lowercase");

assert(
  hasExactDishNameMatch(dishes, "aloo gobi"),
  "case-insensitive exact match"
);
assert(
  hasExactDishNameMatch(dishes, "  ALOO   GOBI  "),
  "whitespace-normalized exact match"
);
assert(
  !hasExactDishNameMatch(dishes, "Aloo"),
  "partial name is not an exact match"
);
assert(
  !hasExactDishNameMatch(dishes, "   "),
  "blank query is not an exact match"
);

assert(shouldShowCreateRow(dishes, "Aloo"), "create row when only partial matches exist");
assertEqual(
  filterDishesForPicker(dishes, "Aloo", "lunch", []).map((d) => d.id),
  ["aloo-gobi"],
  "partial matches stay listed next to the create row"
);
assert(shouldShowCreateRow(dishes, "Pasta"), "create row when nothing matches");
assert(!shouldShowCreateRow(dishes, "aloo gobi"), "hide create row on exact match");
assert(!shouldShowCreateRow(dishes, "  CHICKEN   CURRY "), "hide create row on normalized exact match");
assert(!shouldShowCreateRow(dishes, ""), "hide create row for empty query");
assert(!shouldShowCreateRow(dishes, "   "), "hide create row for whitespace query");
assert(
  !shouldShowCreateRow(dishes, "x".repeat(DISH_NAME_MAX_LENGTH + 1)),
  "hide create row for overlong names"
);

assertEqual(validateDishName(""), "Enter a dish name.", "reject empty name");
assertEqual(validateDishName("   "), "Enter a dish name.", "reject whitespace name");
assertEqual(
  validateDishName("x".repeat(DISH_NAME_MAX_LENGTH + 1)),
  `Dish names can be at most ${DISH_NAME_MAX_LENGTH} characters.`,
  "reject overlong name"
);
assertEqual(validateDishName("  Pasta  "), null, "accept trimmed name");
assertEqual(validateDishName("x".repeat(DISH_NAME_MAX_LENGTH)), null, "accept max length");

const originalTags = ["breakfast"];
assertEqual(appendMealTag(originalTags, "dinner"), ["breakfast", "dinner"], "append missing tag");
assertEqual(originalTags, ["breakfast"], "append does not mutate the original array");
assertEqual(
  appendMealTag(["breakfast", "dinner"], "dinner"),
  ["breakfast", "dinner"],
  "do not duplicate an existing tag"
);
assertEqual(appendMealTag([], "lunch"), ["lunch"], "append onto empty tags");
assertEqual(
  appendMealTag(["lunch", "dinner"], "breakfast"),
  ["lunch", "dinner", "breakfast"],
  "new tag is appended, not prepended"
);
assertEqual(
  appendMealTag(["breakfast"], "tea"),
  ["breakfast", "tea"],
  "append evening tea without replacing"
);
assertEqual(
  appendMealTag(["dinner"], "snack"),
  ["dinner", "snack"],
  "append snack tag without replacing"
);

assert(dishNeedsDetails({ ingredients: [] }), "no ingredients needs details");
assert(!dishNeedsDetails({ ingredients: [{ id: "onion", name: "Onion" }] }), "ingredients are complete");

const created = buildInlineDish("  Evening  Pasta  ", "dinner");
assertEqual(created.name, "Evening Pasta", "inline create stores normalized name");
assertEqual(created.mealTypes, ["dinner"], "inline create tags the slot meal");
assertEqual(created.ingredients, [], "inline create leaves ingredients empty");
assertEqual(created.notes, undefined, "inline create leaves notes empty");
assert(created.id.startsWith("evening-pasta-"), `inline create id slug, got ${created.id}`);

const ranked = filterDishesForPicker(dishes, "", "dinner", ["poha"]);
assertEqual(
  ranked.map((d) => d.id),
  ["poha", "aloo-gobi", "chicken-curry"],
  "selected, then meal-tagged, then other dishes"
);

const dinnerSearch = filterDishesForPicker(dishes, "curry", "lunch", []);
assertEqual(
  dinnerSearch.map((d) => d.id),
  ["chicken-curry"],
  "search includes dishes not yet tagged for the slot"
);

console.log("OK: dish picker name matching, create-row, and tag-append");
