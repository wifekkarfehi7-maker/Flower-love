// ============================================================================
// MenuQR — end-to-end verification against a HOSTED Supabase project.
//
// Why this exists alongside e2e/flow.mjs: that harness drives a real browser
// and asserts through `docker exec psql`, which needs a local stack. A hosted
// project has neither, and in a sandboxed network a browser often cannot reach
// the public internet at all. So this one performs exactly the operations the
// application performs — the same inserts, the same RPCs, the same storage
// paths — as the real `authenticated` and `anon` roles over HTTPS, and asserts
// on what comes back.
//
// It is a check of the backend contract, not of the interface: every call here
// is one the app makes, so a failure means the hosted project would fail the
// same way under the UI.
//
//   NODE_USE_ENV_PROXY=1 E2E_EMAIL=... E2E_PASSWORD=... node e2e/hosted-api-check.mjs
// ============================================================================
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

const results = [];
function check(label, ok, detail = "") {
  results.push({ label, ok: Boolean(ok) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? `\n      ${String(detail).slice(0, 400)}` : ""}`);
}

let TOKEN = "";
const asUser = () => ({ apikey: ANON, Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" });
const asAnon = () => ({ apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" });

async function call(path, { headers, method = "GET", body, prefer } = {}) {
  const h = { ...(headers ?? asUser()) };
  if (prefer) h.Prefer = prefer;
  const r = await fetch(`${URL_}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: r.status, ok: r.ok, body: parsed };
}

const rest = (q, o) => call(`/rest/v1/${q}`, o);
const rpc = (fn, args, headers) => call(`/rest/v1/rpc/${fn}`, { method: "POST", body: args, headers });

const stamp = Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);

try {
  // --- sign in ------------------------------------------------------------
  const auth = await call(`/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: { email: EMAIL, password: PASSWORD },
  });
  TOKEN = auth.body?.access_token ?? "";
  check("the owner can sign in against the hosted project", Boolean(TOKEN), JSON.stringify(auth.body));
  if (!TOKEN) throw new Error("cannot continue without a session");

  const me = await rest("profiles?select=id,email,platform_role");
  const userId = me.body?.[0]?.id;
  check("the auth trigger created the profile row", Boolean(userId), JSON.stringify(me.body));

  // --- create the venue, exactly as the onboarding wizard does -------------
  const slug = `api-cafe-${stamp}`;
  const created = await rest("restaurants?select=id,default_language,status", {
    method: "POST", prefer: "return=representation",
    body: {
      owner_id: userId, name: `API Cafe ${stamp}`, slug,
      restaurant_type: "cafe", default_language: "ar",
      name_ar: `API Cafe ${stamp}`, name_fr: null, name_en: null,
    },
  });
  const rid = created.body?.[0]?.id;
  check("a venue can be created by its owner", Boolean(rid), JSON.stringify(created.body));

  // --- the bootstrap trigger ----------------------------------------------
  const members = await rest(`restaurant_members?restaurant_id=eq.${rid}&select=role,user_id`);
  check("the creator is made the venue owner", members.body?.[0]?.role === "owner", JSON.stringify(members.body));

  const sub = await rest(`subscriptions?restaurant_id=eq.${rid}&select=status,subscription_plans(code)`);
  check("the venue is put on the free plan", sub.body?.[0]?.subscription_plans?.code === "free", JSON.stringify(sub.body));

  const venueQr = await rest(`qr_codes?restaurant_id=eq.${rid}&table_id=is.null&select=id,token`);
  check("the venue gets its general QR code", venueQr.body?.length === 1, JSON.stringify(venueQr.body));

  const settings = await rest(`restaurant_settings?restaurant_id=eq.${rid}&select=restaurant_id`);
  check("the venue gets its settings row", settings.body?.length === 1, JSON.stringify(settings.body));

  // --- menu content --------------------------------------------------------
  const cat = await rest("categories?select=id", {
    method: "POST", prefer: "return=representation",
    body: { restaurant_id: rid, name_ar: "بيتزا", name_fr: null, name_en: "Pizza", sort_order: 1, is_active: true },
  });
  const catId = cat.body?.[0]?.id;
  check("a category can be created", Boolean(catId), JSON.stringify(cat.body));

  const prod = await rest("products?select=id,price", {
    method: "POST", prefer: "return=representation",
    body: {
      restaurant_id: rid, category_id: catId,
      name_ar: "بيتزا مارغريتا", name_en: "Pizza Margherita",
      price: "12.500", is_available: true, sort_order: 1,
    },
  });
  const prodId = prod.body?.[0]?.id;
  check("a product can be created", Boolean(prodId), JSON.stringify(prod.body));
  // numeric(10,3) arrives as a JSON number, so 12.500 reads back as 12.5 —
  // the scale lives in the column and the display formatting in the UI.
  check("the product keeps its exact TND price", Number(prod.body?.[0]?.price) === 12.5, String(prod.body?.[0]?.price));

  // --- image upload, on the path the storage policy authorizes -------------
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAXklEQVR42u3QMQEAAAgDoK1/aM3g4QcF" +
    "aEmwqhZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAgL8FDR8AAeqfaLcAAAAASUVORK5CYII=", "base64");
  const objectPath = `${rid}/product/${stamp}.png`;
  const up = await fetch(`${URL_}/storage/v1/object/menu-images/${objectPath}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${TOKEN}`, "Content-Type": "image/png", "cache-control": "31536000" },
    body: png,
  });
  check("an image uploads into the venue's own folder", up.ok, `${up.status} ${await up.text()}`);

  const publicUrl = `${URL_}/storage/v1/object/public/menu-images/${objectPath}`;
  await rest(`products?id=eq.${prodId}`, { method: "PATCH", body: { image_url: publicUrl } });
  const served = await fetch(publicUrl);
  check("the uploaded image is publicly served", served.status === 200, `HTTP ${served.status}`);

  // Writing into another venue's folder is governed by can_manage_restaurant,
  // which is true for a platform administrator by design — so this account,
  // being one, is the wrong persona to prove tenant isolation with. Owner
  // against owner is covered by supabase/tests/01_rls.sql; what is checked
  // here is the boundary that holds for everyone: an anonymous visitor.
  const anonUpload = await fetch(`${URL_}/storage/v1/object/menu-images/${rid}/product/anon.png`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "image/png" },
    body: png,
  });
  check("an anonymous visitor cannot upload an image", !anonUpload.ok, `HTTP ${anonUpload.status}`);

  // --- tables and QR -------------------------------------------------------
  const table = await rest("restaurant_tables?select=id,name", {
    method: "POST", prefer: "return=representation",
    body: { restaurant_id: rid, name: "Table 7", identifier: "table-7", seats: 4, is_active: true },
  });
  const tableId = table.body?.[0]?.id;
  check("a table can be created", Boolean(tableId), JSON.stringify(table.body));

  const tq = await rest(`qr_codes?table_id=eq.${tableId}&select=token,scan_count`);
  const token = tq.body?.[0]?.token;
  check("its QR code is generated automatically", Boolean(token), JSON.stringify(tq.body));

  // --- publish, then read the menu as a guest would ------------------------
  await rest(`restaurants?id=eq.${rid}`, { method: "PATCH", body: { status: "active", is_published: true } });

  const publicVenue = await rest(`restaurants?slug=eq.${slug}&select=id,name,products(id,name_en,price),categories(id,name_en)`, { headers: asAnon() });
  check("an anonymous guest can read the published menu", publicVenue.body?.[0]?.id === rid, JSON.stringify(publicVenue.body).slice(0, 200));
  check("the menu carries its category and product", (publicVenue.body?.[0]?.categories?.length ?? 0) >= 1 && (publicVenue.body?.[0]?.products?.length ?? 0) >= 1);

  // --- the guest side: resolve the scanned token, record the visit ---------
  const resolved = await rpc("resolve_qr_token", { p_slug: slug, p_token: token }, asAnon());
  const resolvedRow = Array.isArray(resolved.body) ? resolved.body[0] : null;
  check(
    "an anonymous scan resolves the QR token to its table",
    resolved.ok && resolvedRow?.table_id === tableId && resolvedRow?.table_name === "Table 7",
    `${resolved.status} ${JSON.stringify(resolved.body).slice(0, 200)}`
  );

  const session = `sess-${stamp}${stamp}`.slice(0, 24);
  // The app feeds the qr_code_id it just resolved back into tracking; that is
  // what moves the per-code scan counter, so pass it the same way.
  const view = await rpc("track_menu_view", {
    p_restaurant: rid, p_session: session, p_table: tableId,
    p_qr: resolvedRow?.qr_code_id ?? null, p_locale: "ar", p_source: "qr",
  }, asAnon());
  check("an anonymous visit is recorded", view.ok, `${view.status} ${JSON.stringify(view.body)}`);

  const act = await rpc("track_menu_interaction", { p_restaurant: rid, p_session: session, p_kind: "product", p_target: prodId }, asAnon());
  check("an anonymous product tap is accepted", act.ok, `${act.status} ${JSON.stringify(act.body)}`);

  // --- the owner sees it ---------------------------------------------------
  const views = await rest(`menu_views?restaurant_id=eq.${rid}&select=id,source,table_id`);
  check("the owner sees the scan in their analytics data", (views.body?.length ?? 0) >= 1, JSON.stringify(views.body).slice(0, 200));
  check("the scan is attributed to the scanned table", (views.body ?? []).some((v) => v.table_id === tableId));
  const inter = await rest(`menu_interactions?restaurant_id=eq.${rid}&kind=eq.product&select=id`);
  check("opening a product is recorded as interest", (inter.body?.length ?? 0) >= 1, JSON.stringify(inter.body).slice(0, 200));
  const afterScan = await rest(`qr_codes?table_id=eq.${tableId}&select=scan_count`);
  check("the QR scan counter increments", Number(afterScan.body?.[0]?.scan_count) >= 1, JSON.stringify(afterScan.body));

  // --- the boundary anon must not cross ------------------------------------
  const anonTables = await rest("restaurant_tables?select=id", { headers: asAnon() });
  check("an anonymous visitor cannot enumerate tables", anonTables.status === 401, `HTTP ${anonTables.status}`);
  const anonQr = await rest("qr_codes?select=token", { headers: asAnon() });
  check("an anonymous visitor cannot enumerate QR tokens", anonQr.status === 401, `HTTP ${anonQr.status}`);
  const anonProfiles = await rest("profiles?select=email", { headers: asAnon() });
  check("an anonymous visitor cannot read profiles", anonProfiles.status === 401, `HTTP ${anonProfiles.status}`);
  const anonWrite = await rest("menu_views", { method: "POST", headers: asAnon(), body: { restaurant_id: rid, session_id: "x".repeat(16) } });
  check("an anonymous visitor cannot write analytics rows directly", !anonWrite.ok, `HTTP ${anonWrite.status}`);

  // --- admin surface -------------------------------------------------------
  const stats = await rpc("admin_platform_stats", {});
  check("a super admin can read platform statistics", stats.ok, `${stats.status} ${JSON.stringify(stats.body).slice(0, 200)}`);

  console.log(`\nTest venue left in place for inspection: slug "${slug}"`);
} catch (err) {
  check("the run completed without throwing", false, err?.stack || String(err));
} finally {
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} hosted checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}
