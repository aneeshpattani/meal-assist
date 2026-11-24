-- Additive household onboarding: dish notes, RLS-safe create/join RPCs,
-- and a 108-dish starter catalog for every new household.
-- Leaves 001_initial_schema.sql unchanged.

-- ---------------------------------------------------------------------------
-- Schema: persist optional dish notes
-- ---------------------------------------------------------------------------
alter table public.dishes
  add column if not exists notes text;

-- Tighten the existing helper: pin search_path so SECURITY DEFINER cannot be
-- redirected via a malicious search_path.
create or replace function public.user_household_ids()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Starter catalog (108 household dishes from cleaned-dishes-v4.csv)
-- Not readable via the Data API: RLS is on with no policies for anon/authenticated.
-- ---------------------------------------------------------------------------
create table if not exists public.starter_dishes (
  id text primary key,
  name text not null,
  meal_types text[] not null,
  notes text,
  ingredients jsonb not null default '[]'::jsonb
);

alter table public.starter_dishes enable row level security;

insert into public.starter_dishes (id, name, meal_types, notes, ingredients)
select
  item->>'id',
  item->>'name',
  (
    select coalesce(array_agg(value order by ordinality), '{}'::text[])
    from jsonb_array_elements_text(item->'mealTypes') with ordinality as t(value, ordinality)
  ),
  nullif(item->>'notes', ''),
  coalesce(item->'ingredients', '[]'::jsonb)
from jsonb_array_elements(
  $starter_catalog$
[
  {
    "id": "alfredo-pasta",
    "name": "Alfredo Pasta",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "pasta",
        "name": "Pasta"
      },
      {
        "id": "cream",
        "name": "Cream"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "parmesan",
        "name": "Parmesan"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "milk",
        "name": "Milk"
      }
    ]
  },
  {
    "id": "aloo-gobi",
    "name": "Aloo Gobi",
    "mealTypes": [
      "breakfast",
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi for any meal",
    "ingredients": [
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "cauliflower",
        "name": "Cauliflower"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      }
    ]
  },
  {
    "id": "aloo-methi",
    "name": "Aloo Methi",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "fenugreek-leaves",
        "name": "Fenugreek Leaves"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      }
    ]
  },
  {
    "id": "aloo-paratha",
    "name": "Aloo Paratha",
    "mealTypes": [
      "breakfast",
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "whole-wheat-flour",
        "name": "Whole Wheat Flour"
      },
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "ghee",
        "name": "Ghee"
      },
      {
        "id": "coriander",
        "name": "Coriander"
      }
    ]
  },
  {
    "id": "arugula-salad",
    "name": "Arugula Salad",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "arugula",
        "name": "Arugula"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "parmesan",
        "name": "Parmesan"
      }
    ]
  },
  {
    "id": "avial",
    "name": "Avial",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "ash-gourd",
        "name": "Ash Gourd"
      },
      {
        "id": "yam",
        "name": "Yam"
      },
      {
        "id": "carrot",
        "name": "Carrot"
      },
      {
        "id": "drumstick",
        "name": "Drumstick"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "avocado-toast",
    "name": "Avocado Toast",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "bread",
        "name": "Bread"
      },
      {
        "id": "avocado",
        "name": "Avocado"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      }
    ]
  },
  {
    "id": "baby-potato-salad",
    "name": "Baby Potato Salad",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "baby-potato",
        "name": "Baby Potato"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "mustard",
        "name": "Mustard"
      },
      {
        "id": "coriander",
        "name": "Coriander"
      }
    ]
  },
  {
    "id": "baingan-ka-bharta",
    "name": "Baingan ka Bharta",
    "mealTypes": [
      "breakfast",
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi for any meal",
    "ingredients": [
      {
        "id": "brinjal",
        "name": "Brinjal"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      }
    ]
  },
  {
    "id": "baked-butternut-pumpkin-with-feta-and-eggs",
    "name": "Baked Butternut Pumpkin with Feta and Eggs",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "butternut-pumpkin",
        "name": "Butternut Pumpkin"
      },
      {
        "id": "feta-cheese",
        "name": "Feta Cheese"
      },
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      }
    ]
  },
  {
    "id": "beetroot-kebab",
    "name": "Beetroot Kebab",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "beetroot",
        "name": "Beetroot"
      },
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "brown-gram",
        "name": "Brown Gram"
      },
      {
        "id": "onion",
        "name": "Onion"
      }
    ]
  },
  {
    "id": "beetroot-sabji",
    "name": "Beetroot Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "beetroot",
        "name": "Beetroot"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      }
    ]
  },
  {
    "id": "okra-sabji",
    "name": "Okra Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "okra",
        "name": "Okra"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      }
    ]
  },
  {
    "id": "carrot-potato-sabji",
    "name": "Carrot Potato Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "carrot",
        "name": "Carrot"
      },
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "carrot-beans-sabji",
    "name": "Carrot Beans Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "carrot",
        "name": "Carrot"
      },
      {
        "id": "beans",
        "name": "Beans"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      }
    ]
  },
  {
    "id": "chapathi",
    "name": "Chapathi",
    "mealTypes": [
      "breakfast",
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "whole-wheat-flour",
        "name": "Whole Wheat Flour"
      },
      {
        "id": "ghee",
        "name": "Ghee"
      }
    ]
  },
  {
    "id": "dal-methi-curry",
    "name": "Dal Methi Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "toor-dal",
        "name": "Toor Dal"
      },
      {
        "id": "fenugreek-leaves",
        "name": "Fenugreek Leaves"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      }
    ]
  },
  {
    "id": "amaranthus-sabji",
    "name": "Amaranthus Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "amaranthus",
        "name": "Amaranthus"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "onion",
        "name": "Onion"
      }
    ]
  },
  {
    "id": "mushroom-cheese-starter",
    "name": "Mushroom Cheese Starter",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten as starter with lunch/dinner",
    "ingredients": [
      {
        "id": "mushroom",
        "name": "Mushroom"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "mozzarella-cheese",
        "name": "Mozzarella Cheese"
      },
      {
        "id": "onion",
        "name": "Onion"
      }
    ]
  },
  {
    "id": "prawn-coconut-curry",
    "name": "Prawn Coconut Curry",
    "mealTypes": [
      "breakfast",
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with noolputtu or rice for any meal",
    "ingredients": [
      {
        "id": "prawns",
        "name": "Prawns"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "kudampuli",
        "name": "Kudampuli"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      }
    ]
  },
  {
    "id": "moong-dal-curry",
    "name": "Moong Dal Curry",
    "mealTypes": [
      "breakfast",
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for any meal",
    "ingredients": [
      {
        "id": "moong-dal",
        "name": "Moong Dal"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      }
    ]
  },
  {
    "id": "moong-dal-puzhukku",
    "name": "Moong Dal Puzhukku",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "moong-dal",
        "name": "Moong Dal"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      }
    ]
  },
  {
    "id": "chicken-biryani",
    "name": "Chicken Biryani",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "basmati-rice",
        "name": "Basmati Rice"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "biryani-masala",
        "name": "Biryani Masala"
      },
      {
        "id": "mint",
        "name": "Mint"
      }
    ]
  },
  {
    "id": "chicken-cucumber-salad",
    "name": "Chicken Cucumber Salad",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      }
    ]
  },
  {
    "id": "chicken-curry",
    "name": "Chicken Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      }
    ]
  },
  {
    "id": "chicken-cutlet",
    "name": "Chicken Cutlet",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten as starter with lunch/dinner",
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "breadcrumbs",
        "name": "Breadcrumbs"
      },
      {
        "id": "egg",
        "name": "Egg"
      }
    ]
  },
  {
    "id": "chicken-donne-biryani",
    "name": "Chicken Donne Biryani",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "rice",
        "name": "Rice"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "mint",
        "name": "Mint"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "ghee",
        "name": "Ghee"
      }
    ]
  },
  {
    "id": "chicken-momos",
    "name": "Chicken Momos",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "flour",
        "name": "Flour"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "cabbage",
        "name": "Cabbage"
      }
    ]
  },
  {
    "id": "chicken-salad",
    "name": "Chicken Salad",
    "mealTypes": [
      "lunch"
    ],
    "notes": "Often eaten with other dishes for lunch",
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "lettuce",
        "name": "Lettuce"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      }
    ]
  },
  {
    "id": "chicken-soup",
    "name": "Chicken Soup",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "coriander",
        "name": "Coriander"
      }
    ]
  },
  {
    "id": "chicken-steak-with-stir-fry-veggies",
    "name": "Chicken Steak with Stir fry veggies",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "zucchini",
        "name": "Zucchini"
      },
      {
        "id": "capsicum",
        "name": "Capsicum"
      },
      {
        "id": "broccoli",
        "name": "Broccoli"
      },
      {
        "id": "asparagus",
        "name": "Asparagus"
      },
      {
        "id": "onion",
        "name": "Onion"
      }
    ]
  },
  {
    "id": "chickpea-guac-salad-with-doritos",
    "name": "Chickpea Guac Salad with Doritos",
    "mealTypes": [
      "breakfast",
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for any meal",
    "ingredients": [
      {
        "id": "chickpea",
        "name": "Chickpea"
      },
      {
        "id": "avocado",
        "name": "Avocado"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "feta-cheese",
        "name": "Feta cheese"
      },
      {
        "id": "doritos",
        "name": "Doritos"
      }
    ]
  },
  {
    "id": "croissanwich",
    "name": "Croissanwich",
    "mealTypes": [
      "lunch"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "croissant",
        "name": "Croissant"
      },
      {
        "id": "egg",
        "name": "Egg"
      },
      {
        "id": "cheese",
        "name": "Cheese"
      },
      {
        "id": "butter",
        "name": "Butter"
      }
    ]
  },
  {
    "id": "cucumber-curd-curry",
    "name": "Cucumber Curd Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "cucumber-salad",
    "name": "Cucumber Salad",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "coriander",
        "name": "Coriander"
      }
    ]
  },
  {
    "id": "dal-curry",
    "name": "Dal Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "toor-dal",
        "name": "Toor Dal"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "coriander",
        "name": "Coriander"
      }
    ]
  },
  {
    "id": "dal-makhani",
    "name": "Dal Makhani",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "whole-urad-dal",
        "name": "Whole Urad Dal"
      },
      {
        "id": "rajma",
        "name": "Rajma"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "cream",
        "name": "Cream"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      }
    ]
  },
  {
    "id": "daliya-upma",
    "name": "Daliya Upma",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "broken-wheat",
        "name": "Broken Wheat"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "vegetables",
        "name": "Vegetables"
      }
    ]
  },
  {
    "id": "dosa",
    "name": "Dosa",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice",
        "name": "Rice"
      },
      {
        "id": "urad-dal",
        "name": "Urad Dal"
      },
      {
        "id": "fenugreek-seeds",
        "name": "Fenugreek Seeds"
      }
    ]
  },
  {
    "id": "dum-biryani",
    "name": "Dum Biryani",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "basmati-rice",
        "name": "Basmati Rice"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "biryani-masala",
        "name": "Biryani Masala"
      },
      {
        "id": "mint",
        "name": "Mint"
      },
      {
        "id": "saffron",
        "name": "Saffron"
      },
      {
        "id": "ghee",
        "name": "Ghee"
      }
    ]
  },
  {
    "id": "egg-curry",
    "name": "Egg Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "egg-fried-rice",
    "name": "Egg Fried Rice",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice",
        "name": "Rice"
      },
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "soy-sauce",
        "name": "Soy Sauce"
      },
      {
        "id": "spring-onion",
        "name": "Spring Onion"
      }
    ]
  },
  {
    "id": "eggs",
    "name": "Eggs",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "butter",
        "name": "Butter"
      }
    ]
  },
  {
    "id": "elanji",
    "name": "Elanji",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "jaggery",
        "name": "Jaggery"
      },
      {
        "id": "almond",
        "name": "Almond"
      },
      {
        "id": "cashew",
        "name": "Cashew"
      },
      {
        "id": "cardamom-powder",
        "name": "Cardamom powder"
      },
      {
        "id": "wheat-dosa",
        "name": "Wheat Dosa"
      }
    ]
  },
  {
    "id": "erissery",
    "name": "Erissery",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "pumpkin",
        "name": "Pumpkin"
      },
      {
        "id": "red-cowpeas",
        "name": "Red Cowpeas"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "feta-tomato-bruschetta",
    "name": "Feta Tomato Bruschetta",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "bread",
        "name": "Bread"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "feta-cheese",
        "name": "Feta Cheese"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "basil",
        "name": "Basil"
      }
    ]
  },
  {
    "id": "fish-fry",
    "name": "Fish Fry",
    "mealTypes": [
      "lunch"
    ],
    "notes": "Often eaten with rice for lunch",
    "ingredients": [
      {
        "id": "fish",
        "name": "Fish"
      },
      {
        "id": "chilli-powder",
        "name": "Chilli Powder"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "pepper",
        "name": "Pepper"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "coconut-oil",
        "name": "Coconut Oil"
      }
    ]
  },
  {
    "id": "gobi-manchurian",
    "name": "Gobi Manchurian",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "cauliflower",
        "name": "Cauliflower"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "capsicum",
        "name": "Capsicum"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "soy-sauce",
        "name": "Soy Sauce"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      }
    ]
  },
  {
    "id": "greek-salad",
    "name": "Greek Salad",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "feta-cheese",
        "name": "Feta Cheese"
      },
      {
        "id": "olive",
        "name": "Olive"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      }
    ]
  },
  {
    "id": "hara-bhara-kebab",
    "name": "Hara Bhara Kebab",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "spinach",
        "name": "Spinach"
      },
      {
        "id": "peas",
        "name": "Peas"
      },
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "breadcrumbs",
        "name": "Breadcrumbs"
      }
    ]
  },
  {
    "id": "herbed-chicken",
    "name": "Herbed Chicken",
    "mealTypes": [
      "dinner"
    ],
    "notes": "Often eaten with other dishes for dinner",
    "ingredients": [
      {
        "id": "chicken",
        "name": "Chicken"
      },
      {
        "id": "herbs",
        "name": "Herbs"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      }
    ]
  },
  {
    "id": "hummus",
    "name": "Hummus",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "chickpea",
        "name": "Chickpea"
      },
      {
        "id": "tahini",
        "name": "Tahini"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      }
    ]
  },
  {
    "id": "kadala-puzhukku",
    "name": "Kadala Puzhukku",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "black-chickpea",
        "name": "Black Chickpea"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      }
    ]
  },
  {
    "id": "kaipakka-upperi",
    "name": "Kaipakka Upperi",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "bitter-gourd",
        "name": "Bitter Gourd"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "kappa",
    "name": "Kappa",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "tapioca",
        "name": "Tapioca"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "kappa-moleeshan",
    "name": "Kappa Moleeshan",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "tapioca",
        "name": "Tapioca"
      },
      {
        "id": "fish",
        "name": "Fish"
      },
      {
        "id": "coconut-milk",
        "name": "Coconut Milk"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "khichdi",
    "name": "Khichdi",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice",
        "name": "Rice"
      },
      {
        "id": "moong-dal",
        "name": "Moong Dal"
      },
      {
        "id": "ghee",
        "name": "Ghee"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      }
    ]
  },
  {
    "id": "kootu-curry",
    "name": "Kootu Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "yam",
        "name": "Yam"
      },
      {
        "id": "ash-gourd",
        "name": "Ash Gourd"
      },
      {
        "id": "black-chickpea",
        "name": "Black Chickpea"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "kovakka-upperi",
    "name": "Kovakka Upperi",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "ivy-gourd",
        "name": "Ivy Gourd"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      }
    ]
  },
  {
    "id": "lasagna",
    "name": "Lasagna",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "pasta",
        "name": "Pasta"
      },
      {
        "id": "tomato-sauce",
        "name": "Tomato Sauce"
      },
      {
        "id": "mozzarella-cheese",
        "name": "Mozzarella Cheese"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "basil",
        "name": "Basil"
      }
    ]
  },
  {
    "id": "lauki-kofta",
    "name": "Lauki Kofta",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "bottle-gourd",
        "name": "Bottle Gourd"
      },
      {
        "id": "besan",
        "name": "Besan"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "cream",
        "name": "Cream"
      }
    ]
  },
  {
    "id": "mango-chia-pudding",
    "name": "Mango Chia Pudding",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "mango",
        "name": "Mango"
      },
      {
        "id": "chia-seeds",
        "name": "Chia Seeds"
      },
      {
        "id": "milk",
        "name": "Milk"
      },
      {
        "id": "honey",
        "name": "Honey"
      },
      {
        "id": "cardamom",
        "name": "Cardamom"
      }
    ]
  },
  {
    "id": "methi-paratha",
    "name": "Methi Paratha",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "whole-wheat-flour",
        "name": "Whole Wheat Flour"
      },
      {
        "id": "fenugreek-leaves",
        "name": "Fenugreek Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "ghee",
        "name": "Ghee"
      }
    ]
  },
  {
    "id": "mixed-veg-sabji",
    "name": "Mixed Veg Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "carrot",
        "name": "Carrot"
      },
      {
        "id": "beans",
        "name": "Beans"
      },
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "peas",
        "name": "Peas"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      }
    ]
  },
  {
    "id": "momos",
    "name": "Momos",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "flour",
        "name": "Flour"
      },
      {
        "id": "cabbage",
        "name": "Cabbage"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "carrot",
        "name": "Carrot"
      }
    ]
  },
  {
    "id": "curd-curry",
    "name": "Curd Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "mushroom-bruschetta",
    "name": "Mushroom Bruschetta",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "bread",
        "name": "Bread"
      },
      {
        "id": "mushroom",
        "name": "Mushroom"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "butter",
        "name": "Butter"
      }
    ]
  },
  {
    "id": "mushroom-cabbage-sabji",
    "name": "Mushroom Cabbage Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "May be mushroom and cabbage varav together or separate",
    "ingredients": [
      {
        "id": "mushroom",
        "name": "Mushroom"
      },
      {
        "id": "cabbage",
        "name": "Cabbage"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      }
    ]
  },
  {
    "id": "egg-roast",
    "name": "Egg Roast",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      }
    ]
  },
  {
    "id": "mutton-curry",
    "name": "Mutton Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "mutton",
        "name": "Mutton"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "garam-masala",
        "name": "Garam Masala"
      }
    ]
  },
  {
    "id": "mutton-donne-biryani",
    "name": "Mutton Donne Biryani",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "mutton",
        "name": "Mutton"
      },
      {
        "id": "rice",
        "name": "Rice"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "mint",
        "name": "Mint"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "ghee",
        "name": "Ghee"
      }
    ]
  },
  {
    "id": "noolputtu",
    "name": "Noolputtu",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice-flour",
        "name": "Rice Flour"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      }
    ]
  },
  {
    "id": "oatmeal",
    "name": "Oatmeal",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "oats",
        "name": "Oats"
      },
      {
        "id": "milk",
        "name": "Milk"
      },
      {
        "id": "sugar",
        "name": "Sugar"
      },
      {
        "id": "cardamom",
        "name": "Cardamom"
      }
    ]
  },
  {
    "id": "pachadi",
    "name": "Pachadi",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "cucumber",
        "name": "Cucumber"
      }
    ]
  },
  {
    "id": "palak-kebab",
    "name": "Palak Kebab",
    "mealTypes": [
      "dinner"
    ],
    "notes": "Often eaten with other dishes for dinner",
    "ingredients": [
      {
        "id": "spinach",
        "name": "Spinach"
      },
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "besan",
        "name": "Besan"
      },
      {
        "id": "onion",
        "name": "Onion"
      }
    ]
  },
  {
    "id": "palak-paneer",
    "name": "Palak Paneer",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "spinach",
        "name": "Spinach"
      },
      {
        "id": "paneer",
        "name": "Paneer"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "cream",
        "name": "Cream"
      }
    ]
  },
  {
    "id": "palak-raita",
    "name": "Palak Raita",
    "mealTypes": [
      "lunch"
    ],
    "notes": "Often eaten with rice for lunch",
    "ingredients": [
      {
        "id": "spinach",
        "name": "Spinach"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      }
    ]
  },
  {
    "id": "pancake",
    "name": "Pancake",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "flour",
        "name": "Flour"
      },
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "milk",
        "name": "Milk"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "sugar",
        "name": "Sugar"
      }
    ]
  },
  {
    "id": "paneer-butter-masala",
    "name": "Paneer Butter Masala",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with chappathi or rice for lunch/dinner",
    "ingredients": [
      {
        "id": "paneer",
        "name": "Paneer"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "cream",
        "name": "Cream"
      },
      {
        "id": "cashew",
        "name": "Cashew"
      },
      {
        "id": "garam-masala",
        "name": "Garam Masala"
      }
    ]
  },
  {
    "id": "paneer-salad",
    "name": "Paneer Salad",
    "mealTypes": [
      "lunch"
    ],
    "notes": "Often eaten with other dishes for lunch",
    "ingredients": [
      {
        "id": "paneer",
        "name": "Paneer"
      },
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      }
    ]
  },
  {
    "id": "paneer-tikka",
    "name": "Paneer Tikka",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten as starter with lunch/dinner",
    "ingredients": [
      {
        "id": "paneer",
        "name": "Paneer"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "chilli-powder",
        "name": "Chilli Powder"
      },
      {
        "id": "garam-masala",
        "name": "Garam Masala"
      },
      {
        "id": "capsicum",
        "name": "Capsicum"
      },
      {
        "id": "onion",
        "name": "Onion"
      }
    ]
  },
  {
    "id": "pathiri",
    "name": "Pathiri",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice-flour",
        "name": "Rice Flour"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      }
    ]
  },
  {
    "id": "pesto-pasta",
    "name": "Pesto Pasta",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "pasta",
        "name": "Pasta"
      },
      {
        "id": "basil",
        "name": "Basil"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "parmesan",
        "name": "Parmesan"
      },
      {
        "id": "pine-nuts",
        "name": "Pine Nuts"
      }
    ]
  },
  {
    "id": "pesto-toast",
    "name": "Pesto Toast",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "bread",
        "name": "Bread"
      },
      {
        "id": "basil",
        "name": "Basil"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "parmesan",
        "name": "Parmesan"
      }
    ]
  },
  {
    "id": "poha",
    "name": "Poha",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "flattened-rice",
        "name": "Flattened Rice"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "peanuts",
        "name": "Peanuts"
      }
    ]
  },
  {
    "id": "potato-fry",
    "name": "Potato Fry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "chilli-powder",
        "name": "Chilli Powder"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "onion",
        "name": "Onion"
      }
    ]
  },
  {
    "id": "potato-stew",
    "name": "Potato Stew",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "coconut-milk",
        "name": "Coconut Milk"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "prawns-fry",
    "name": "Prawns Fry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten as starter with lunch/dinner",
    "ingredients": [
      {
        "id": "prawns",
        "name": "Prawns"
      }
    ]
  },
  {
    "id": "pumpkin-soup",
    "name": "Pumpkin Soup",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "pumpkin",
        "name": "Pumpkin"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "coconut-milk",
        "name": "Coconut Milk"
      },
      {
        "id": "butter",
        "name": "Butter"
      }
    ]
  },
  {
    "id": "puttu",
    "name": "Puttu",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice-flour",
        "name": "Rice Flour"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      }
    ]
  },
  {
    "id": "radish-salad",
    "name": "Radish Salad",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with other dishes for lunch/dinner",
    "ingredients": [
      {
        "id": "radish",
        "name": "Radish"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "lemon",
        "name": "Lemon"
      },
      {
        "id": "coriander",
        "name": "Coriander"
      }
    ]
  },
  {
    "id": "rajma",
    "name": "Rajma",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "rajma",
        "name": "Rajma"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "ginger",
        "name": "Ginger"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      }
    ]
  },
  {
    "id": "raw-mango-curry",
    "name": "Raw Mango Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "raw-mango",
        "name": "Raw Mango"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "rice",
    "name": "Rice",
    "mealTypes": [
      "lunch"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice",
        "name": "Rice"
      }
    ]
  },
  {
    "id": "sambar",
    "name": "Sambar",
    "mealTypes": [
      "lunch"
    ],
    "notes": "Often eaten with rice for lunch",
    "ingredients": [
      {
        "id": "toor-dal",
        "name": "Toor Dal"
      },
      {
        "id": "tamarind",
        "name": "Tamarind"
      },
      {
        "id": "drumstick",
        "name": "Drumstick"
      },
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "sambar-powder",
        "name": "Sambar Powder"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "scrambled-eggs",
    "name": "Scrambled Eggs",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "milk",
        "name": "Milk"
      }
    ]
  },
  {
    "id": "smash-potato-salad",
    "name": "Smash Potato Salad",
    "mealTypes": [
      "lunch"
    ],
    "notes": "Often eaten with other dishes for lunch",
    "ingredients": [
      {
        "id": "potato",
        "name": "Potato"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "mustard",
        "name": "Mustard"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      }
    ]
  },
  {
    "id": "steak",
    "name": "Steak",
    "mealTypes": [
      "lunch"
    ],
    "notes": "Meat unspecified (could be beef or chicken)",
    "ingredients": [
      {
        "id": "beef",
        "name": "Beef"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      }
    ]
  },
  {
    "id": "steak-with-zucchini",
    "name": "Steak with Zucchini",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "steak",
        "name": "Steak"
      },
      {
        "id": "zucchini",
        "name": "Zucchini"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      },
      {
        "id": "butter",
        "name": "Butter"
      }
    ]
  },
  {
    "id": "summer-roll",
    "name": "Summer Roll",
    "mealTypes": [
      "lunch"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice-paper",
        "name": "Rice Paper"
      },
      {
        "id": "lettuce",
        "name": "Lettuce"
      },
      {
        "id": "carrot",
        "name": "Carrot"
      },
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "mint",
        "name": "Mint"
      },
      {
        "id": "rice-noodles",
        "name": "Rice Noodles"
      }
    ]
  },
  {
    "id": "sweet-potato-avocado-salad",
    "name": "Sweet Potato Avocado Salad",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "sweet-potato",
        "name": "Sweet Potato"
      },
      {
        "id": "avocado",
        "name": "Avocado"
      },
      {
        "id": "eggs",
        "name": "Eggs"
      }
    ]
  },
  {
    "id": "sweet-potato-pancakes",
    "name": "Sweet Potato Pancakes",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "sweet-potato",
        "name": "Sweet Potato"
      },
      {
        "id": "flour",
        "name": "Flour"
      },
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "milk",
        "name": "Milk"
      },
      {
        "id": "cinnamon",
        "name": "Cinnamon"
      }
    ]
  },
  {
    "id": "tomato-soup",
    "name": "Tomato Soup",
    "mealTypes": [
      "dinner"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "tomato",
        "name": "Tomato"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "cream",
        "name": "Cream"
      }
    ]
  },
  {
    "id": "turkish-eggs",
    "name": "Turkish Eggs",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "eggs",
        "name": "Eggs"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "butter",
        "name": "Butter"
      },
      {
        "id": "chilli-flakes",
        "name": "Chilli Flakes"
      },
      {
        "id": "garlic",
        "name": "Garlic"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil"
      }
    ]
  },
  {
    "id": "upma",
    "name": "Upma",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rava",
        "name": "Rava"
      },
      {
        "id": "onion",
        "name": "Onion"
      },
      {
        "id": "mustard-seeds",
        "name": "Mustard Seeds"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "vegetables",
        "name": "Vegetables"
      }
    ]
  },
  {
    "id": "vellappam",
    "name": "Vellappam",
    "mealTypes": [
      "breakfast"
    ],
    "notes": null,
    "ingredients": [
      {
        "id": "rice",
        "name": "Rice"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "yeast",
        "name": "Yeast"
      },
      {
        "id": "sugar",
        "name": "Sugar"
      }
    ]
  },
  {
    "id": "vellarikka-kaipakka-curry",
    "name": "Vellarikka Kaipakka Curry",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "bitter-gourd",
        "name": "Bitter Gourd"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "chilli",
        "name": "Chilli"
      },
      {
        "id": "turmeric",
        "name": "Turmeric"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  },
  {
    "id": "vellarikka-sabji",
    "name": "Vellarikka Sabji",
    "mealTypes": [
      "lunch",
      "dinner"
    ],
    "notes": "Often eaten with rice for lunch/dinner",
    "ingredients": [
      {
        "id": "cucumber",
        "name": "Cucumber"
      },
      {
        "id": "coconut",
        "name": "Coconut"
      },
      {
        "id": "yogurt",
        "name": "Yogurt"
      },
      {
        "id": "cumin",
        "name": "Cumin"
      },
      {
        "id": "green-chilli",
        "name": "Green Chilli"
      },
      {
        "id": "curry-leaves",
        "name": "Curry Leaves"
      }
    ]
  }
]
$starter_catalog$::jsonb
) as item
on conflict (id) do update
set
  name = excluded.name,
  meal_types = excluded.meal_types,
  notes = excluded.notes,
  ingredients = excluded.ingredients;

-- Copy the catalog into a household. Idempotent: existing dish rows are kept.
create or replace function public.seed_household_starter_dishes(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.dishes (id, household_id, name, meal_types, notes, ingredients)
  select
    s.id,
    p_household_id,
    s.name,
    s.meal_types,
    s.notes,
    s.ingredients
  from public.starter_dishes s
  on conflict (household_id, id) do nothing;
end;
$$;

revoke all on function public.seed_household_starter_dishes(uuid) from public;
revoke all on function public.seed_household_starter_dishes(uuid) from anon, authenticated;

-- Seed dishes + empty weekly plan for every new household (RPC or otherwise).
create or replace function public.handle_new_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.weekly_plans (household_id, plan)
  values (new.id, '{}'::jsonb)
  on conflict (household_id) do nothing;

  perform public.seed_household_starter_dishes(new.id);
  return new;
end;
$$;

revoke all on function public.handle_new_household() from public;
revoke all on function public.handle_new_household() from anon, authenticated;

drop trigger if exists on_household_created on public.households;
create trigger on_household_created
  after insert on public.households
  for each row
  execute function public.handle_new_household();

-- ---------------------------------------------------------------------------
-- RLS-safe household create / join
--
-- households SELECT is limited to members. That means:
--   * insert().select() after creating a household fails (creator is not a
--     member yet, so RETURNING/SELECT is filtered)
--   * looking up a household by invite_code to join also fails
-- SECURITY DEFINER RPCs run as the owner (bypass RLS) after auth.uid() checks.
-- ---------------------------------------------------------------------------
create or replace function public.create_household(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_invite text;
  v_name text;
  v_existing_id uuid;
  v_existing_code text;
  v_attempts int := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select hm.household_id, h.invite_code
    into v_existing_id, v_existing_code
  from public.household_members hm
  join public.households h on h.id = hm.household_id
  where hm.user_id = v_user_id
  order by h.created_at asc
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object(
      'id', v_existing_id,
      'invite_code', v_existing_code
    );
  end if;

  v_name := nullif(btrim(coalesce(p_name, '')), '');
  if v_name is null then
    v_name := 'Home';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_invite := upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.households (name, invite_code)
      values (v_name, v_invite)
      returning id into v_household_id;
      exit;
    exception
      when unique_violation then
        if v_attempts >= 8 then
          raise exception 'Could not allocate an invite code' using errcode = 'P0001';
        end if;
    end;
  end loop;

  insert into public.household_members (household_id, user_id)
  values (v_household_id, v_user_id);

  return jsonb_build_object(
    'id', v_household_id,
    'invite_code', v_invite
  );
end;
$$;

create or replace function public.join_household(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text;
  v_household_id uuid;
  v_invite text;
  v_existing_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  v_code := upper(btrim(coalesce(p_invite_code, '')));
  if v_code = '' then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  select h.id, h.invite_code
    into v_household_id, v_invite
  from public.households h
  where h.invite_code = v_code;

  if v_household_id is null then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  select hm.household_id
    into v_existing_id
  from public.household_members hm
  where hm.user_id = v_user_id
  order by hm.household_id
  limit 1;

  if v_existing_id is not null and v_existing_id <> v_household_id then
    raise exception 'Already a member of a household' using errcode = 'P0001';
  end if;

  insert into public.household_members (household_id, user_id)
  values (v_household_id, v_user_id)
  on conflict (household_id, user_id) do nothing;

  return jsonb_build_object(
    'id', v_household_id,
    'invite_code', v_invite
  );
end;
$$;

revoke all on function public.create_household(text) from public;
revoke all on function public.create_household(text) from anon;
grant execute on function public.create_household(text) to authenticated;

revoke all on function public.join_household(text) from public;
revoke all on function public.join_household(text) from anon;
grant execute on function public.join_household(text) to authenticated;
