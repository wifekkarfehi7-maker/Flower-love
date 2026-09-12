-- ============================================================================
-- MenuQR — seed
-- 1. The three subscription plans (required: a new restaurant is put on the
--    free plan by the restaurants bootstrap trigger).
-- 2. seed_demo_restaurant() / remove_demo_restaurant() — an optional demo
--    café with realistic Tunisian menu items, easy to add and easy to drop.
--
-- Feature lists are stored as translation KEYS, not sentences: the app renders
-- them from its own ar/fr/en dictionaries so plans stay multilingual.
-- ============================================================================

insert into public.subscription_plans (
  code, name_ar, name_fr, name_en,
  description_ar, description_fr, description_en,
  price_monthly, price_yearly, currency,
  max_categories, max_products, max_tables, max_members,
  features, sort_order
) values
(
  'free',
  'تجريبي', 'Essai', 'Trial',
  'جرّب المنيو الرقمي ورمز QR بلا ما تخلّص.',
  'Essayez le menu digital et le QR code, gratuitement.',
  'Try the digital menu and QR code, free.',
  0, 0, 'TND',
  5, 30, 3, 1,
  '["menu_digital","qr_basic","languages_three","mobile_menu"]'::jsonb,
  1
),
(
  'pro',
  'اشتراك', 'Abonnement', 'Subscription',
  'كل المزايا بلا حدود: منتوجات، طاولات، طلبات من التليفون وتحليلات.',
  'Tout, sans limite : produits, tables, commandes depuis le téléphone et statistiques.',
  'Everything, with no limits: products, tables, phone ordering and analytics.',
  29.900, 299.000, 'TND',
  null, null, null, 10,
  '["everything_free","categories_unlimited","products_unlimited","tables_unlimited","qr_per_table","ordering","analytics","custom_branding","product_options","priority_support"]'::jsonb,
  2
)

on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  description_ar = excluded.description_ar,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  max_categories = excluded.max_categories,
  max_products = excluded.max_products,
  max_tables = excluded.max_tables,
  max_members = excluded.max_members,
  features = excluded.features,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Demo restaurant
--   select public.seed_demo_restaurant('<your-user-uuid>');
--   select public.remove_demo_restaurant();
-- ---------------------------------------------------------------------------

create or replace function public.seed_demo_restaurant(
  p_owner uuid,
  p_slug text default 'cafe-el-medina'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_restaurant uuid;
  v_breakfast uuid;
  v_pizza uuid;
  v_sandwich uuid;
  v_drinks uuid;
  v_desserts uuid;
  v_pro uuid;
begin
  if auth.uid() is not null and auth.uid() <> p_owner and not public.is_super_admin() then
    raise exception 'You can only seed demo data onto your own account' using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.profiles where id = p_owner) then
    raise exception 'No profile for %', p_owner using errcode = 'no_data_found';
  end if;

  if exists (select 1 from public.restaurants where slug = p_slug) then
    raise exception 'Slug % is already taken', p_slug using errcode = 'unique_violation';
  end if;

  insert into public.restaurants (
    owner_id, name, slug, restaurant_type,
    name_ar, name_fr, name_en,
    description_ar, description_fr, description_en,
    phone, address, currency, default_language,
    primary_color, secondary_color, theme
  ) values (
    p_owner, 'Café El Medina', p_slug, 'cafe',
    'قهوة المدينة', 'Café El Medina', 'Café El Medina',
    'قهوة تونسية أصيلة في قلب المدينة العتيقة — فطور، بيتزا، ساندويتش ومشروبات.',
    'Un café tunisien authentique au cœur de la médina — petit déjeuner, pizza, sandwichs et boissons.',
    'An authentic Tunisian café in the heart of the medina — breakfast, pizza, sandwiches and drinks.',
    '+216 71 000 000', 'Rue de la Kasbah, Tunis',
    'TND', 'ar',
    '#0F766E', '#F59E0B', 'coffee'
  )
  returning id into v_restaurant;

  -- The demo shows off per-table QR codes and analytics, so put it on Pro.
  select id into v_pro from public.subscription_plans where code = 'pro';
  if v_pro is not null then
    update public.subscriptions set plan_id = v_pro where restaurant_id = v_restaurant;
  end if;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'فطور الصباح', 'Petit Déjeuner', 'Breakfast', 1)
  returning id into v_breakfast;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'بيتزا', 'Pizza', 'Pizza', 2)
  returning id into v_pizza;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'ساندويتش', 'Sandwich', 'Sandwich', 3)
  returning id into v_sandwich;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'مشروبات', 'Boissons', 'Drinks', 4)
  returning id into v_drinks;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'حلويات', 'Desserts', 'Desserts', 5)
  returning id into v_desserts;

  insert into public.products (
    restaurant_id, category_id, name_ar, name_fr, name_en,
    description_ar, description_fr, description_en, price, sort_order, is_featured
  ) values
  (v_restaurant, v_breakfast, 'لبلابي', 'Lablabi', 'Lablabi',
   'حمص ساخن بالخبز، الهريسة، الكمون وزيت الزيتون.',
   'Pois chiches chauds avec pain, harissa, cumin et huile d''olive.',
   'Hot chickpeas with bread, harissa, cumin and olive oil.', 6.000, 1, true),
  (v_restaurant, v_breakfast, 'كرواسون', 'Croissant', 'Croissant',
   'كرواسون بالزبدة طازج كل صباح.',
   'Croissant pur beurre, cuit chaque matin.',
   'All-butter croissant, baked every morning.', 1.500, 2, false),
  (v_restaurant, v_breakfast, 'شكشوكة', 'Chakchouka', 'Chakchouka',
   'طماطم، فلفل وبيض على الطريقة التونسية.',
   'Tomates, poivrons et œufs à la tunisienne.',
   'Tomatoes, peppers and eggs, Tunisian style.', 8.500, 3, false),
  (v_restaurant, v_pizza, 'بيتزا مارغريتا', 'Pizza Margherita', 'Margherita Pizza',
   'صلصة طماطم، موزاريلا وريحان.',
   'Sauce tomate, mozzarella et basilic.',
   'Tomato sauce, mozzarella and basil.', 12.500, 1, true),
  (v_restaurant, v_pizza, 'بيتزا تن', 'Pizza Thon', 'Tuna Pizza',
   'تن، زيتون، موزاريلا وصلصة طماطم.',
   'Thon, olives, mozzarella et sauce tomate.',
   'Tuna, olives, mozzarella and tomato sauce.', 15.000, 2, false),
  (v_restaurant, v_pizza, 'بيتزا أربعة أجبان', 'Pizza 4 Fromages', 'Four Cheese Pizza',
   'موزاريلا، غرويار، شيدر وجبن أزرق.',
   'Mozzarella, gruyère, cheddar et bleu.',
   'Mozzarella, gruyère, cheddar and blue cheese.', 17.000, 3, false),
  (v_restaurant, v_sandwich, 'ساندويتش إسكالوب', 'Sandwich Escalope', 'Escalope Sandwich',
   'إسكالوب دجاج، سلطة، جبن وصلصة.',
   'Escalope de poulet, salade, fromage et sauce.',
   'Chicken escalope, salad, cheese and sauce.', 7.500, 1, true),
  (v_restaurant, v_sandwich, 'ساندويتش تن', 'Sandwich Thon', 'Tuna Sandwich',
   'تن، بيض، زيتون وهريسة في خبز طابونة.',
   'Thon, œuf, olives et harissa dans du pain tabouna.',
   'Tuna, egg, olives and harissa in tabouna bread.', 5.500, 2, false),
  (v_restaurant, v_sandwich, 'شاباتي دجاج', 'Chapati Poulet', 'Chicken Chapati',
   'دجاج مشوي، جبن، سلطة وصلصة الثوم.',
   'Poulet grillé, fromage, salade et sauce à l''ail.',
   'Grilled chicken, cheese, salad and garlic sauce.', 9.000, 3, false),
  (v_restaurant, v_drinks, 'قهوة إكسبرس', 'Café Express', 'Espresso',
   'قهوة تونسية قوية.',
   'Café tunisien serré.',
   'Strong Tunisian espresso.', 1.800, 1, false),
  (v_restaurant, v_drinks, 'كابوتشينو', 'Cappuccino', 'Cappuccino',
   'إكسبرس بحليب مرغي وقليل من القرفة.',
   'Espresso, lait mousseux et une pointe de cannelle.',
   'Espresso, foamed milk and a hint of cinnamon.', 3.500, 2, true),
  (v_restaurant, v_drinks, 'عصير برتقال', 'Jus d''Orange', 'Orange Juice',
   'برتقال طازج معصور في الحين.',
   'Oranges fraîchement pressées.',
   'Freshly squeezed oranges.', 5.000, 3, false),
  (v_restaurant, v_drinks, 'شاي بالنعناع', 'Thé à la Menthe', 'Mint Tea',
   'شاي أحمر بالنعناع والصنوبر.',
   'Thé à la menthe avec pignons de pin.',
   'Mint tea with pine nuts.', 2.500, 4, false),
  (v_restaurant, v_desserts, 'كريب نوتيلا', 'Crêpe Nutella', 'Nutella Crêpe',
   'كريب طازج بالنوتيلا والموز.',
   'Crêpe fraîche au Nutella et banane.',
   'Fresh crêpe with Nutella and banana.', 8.500, 1, true),
  (v_restaurant, v_desserts, 'بقلاوة', 'Baklawa', 'Baklava',
   'بقلاوة تونسية باللوز والعسل.',
   'Baklawa tunisienne aux amandes et miel.',
   'Tunisian baklava with almonds and honey.', 4.000, 2, false);

  insert into public.restaurant_tables (restaurant_id, name, identifier, zone, seats, sort_order) values
  (v_restaurant, 'Table 1', 'table-1', 'Salle', 4, 1),
  (v_restaurant, 'Table 2', 'table-2', 'Salle', 4, 2),
  (v_restaurant, 'Table 3', 'table-3', 'Salle', 2, 3),
  (v_restaurant, 'Terrasse 1', 'terrasse-1', 'Terrasse', 6, 4),
  (v_restaurant, 'Terrasse 2', 'terrasse-2', 'Terrasse', 6, 5),
  (v_restaurant, 'VIP 1', 'vip-1', 'VIP', 8, 6);

  update public.restaurant_settings
    set opening_hours = '[
      {"day":0,"open":"07:00","close":"23:00","closed":false},
      {"day":1,"open":"07:00","close":"23:00","closed":false},
      {"day":2,"open":"07:00","close":"23:00","closed":false},
      {"day":3,"open":"07:00","close":"23:00","closed":false},
      {"day":4,"open":"07:00","close":"23:00","closed":false},
      {"day":5,"open":"07:00","close":"00:00","closed":false},
      {"day":6,"open":"08:00","close":"00:00","closed":false}
    ]'::jsonb
    where restaurant_id = v_restaurant;

  return v_restaurant;
end;
$$;

revoke all on function public.seed_demo_restaurant(uuid, text) from public;
grant execute on function public.seed_demo_restaurant(uuid, text) to authenticated;

create or replace function public.remove_demo_restaurant(p_slug text default 'cafe-el-medina')
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_restaurant uuid;
  v_owner uuid;
begin
  select id, owner_id into v_restaurant, v_owner from public.restaurants where slug = p_slug;
  if v_restaurant is null then
    return;
  end if;

  if auth.uid() is not null and auth.uid() <> v_owner and not public.is_super_admin() then
    raise exception 'Not allowed' using errcode = 'insufficient_privilege';
  end if;

  delete from public.restaurants where id = v_restaurant;
end;
$$;

revoke all on function public.remove_demo_restaurant(text) from public;
grant execute on function public.remove_demo_restaurant(text) to authenticated;
