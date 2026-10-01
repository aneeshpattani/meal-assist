-- Additive domain notes (no breaking schema change).
-- dishes.meal_types is text[] and already accepts new tags: 'tea' and 'snack'.
-- weekly_plans.plan is jsonb. Day objects may now include:
--   tea: text[]
--   snacks: { breakfast?: text[], lunch?: text[], dinner?: text[], tea?: text[] }
-- Existing breakfast/lunch/dinner arrays remain valid. RLS is unchanged.

select 1;
