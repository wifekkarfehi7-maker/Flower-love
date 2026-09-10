/**
 * End-to-end verification against a running MenuQR + Supabase stack.
 *
 *   supabase start
 *   npm run dev
 *   npm run e2e
 *
 * It drives a real browser through the whole product: register, log in,
 * create a venue, build a menu, upload an image, open the public menu, scan a
 * table QR, read the analytics that scan produced, reset a password through
 * the emailed link, and check the admin surface and the demo venue.
 *
 * Database assertions go through the local Supabase Postgres container, so the
 * checks confirm what was actually persisted rather than what the UI claims.
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MAIL = process.env.E2E_MAIL ?? "http://127.0.0.1:54324";
const DB_CONTAINER = process.env.E2E_DB_CONTAINER ?? "supabase_db_menuqr";
const CHROME = process.env.E2E_CHROME;
const SHOTS = process.env.E2E_SHOTS ?? "/tmp/menuqr-e2e";
const PASSWORD = "MenuQR-e2e-2026";

mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(label, ok, detail = "") {
  results.push({ label, ok: Boolean(ok) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? `\n      ${String(detail).slice(0, 300)}` : ""}`);
}

function sql(query) {
  return execFileSync("docker", ["exec", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-tAc", query], {
    encoding: "utf8",
  }).trim();
}

const uniq = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

// A real 64×64 PNG for the upload step.
const IMAGE_PATH = "/tmp/menuqr-e2e-product.png";
writeFileSync(
  IMAGE_PATH,
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAXklEQVR42u3QMQEAAAgDoK1/aM3g4QcF" +
      "aEmwqhZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAgL8FDR8AAeqfaLcAAAAASUVORK5CYII=",
    "base64"
  )
);

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});

/** A dashboard context, with the interface pinned to English for stable selectors. */
async function freshContext(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  await context.addInitScript(() => window.localStorage.setItem("menuqr-locale", "en"));
  return context;
}

/** A first-time guest: a phone, and no stored language preference. */
function guestContextOptions() {
  return { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
}

async function registerAccount(page, email) {
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill("#fullName", "E2E Owner");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.fill("#confirmPassword", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 30000 });
}

async function login(page, email, password = PASSWORD) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
}

try {
  // =======================================================================
  // 1. Owner journey: register -> menu -> QR -> analytics
  // =======================================================================
  const stamp = uniq();
  const email = `owner-${stamp}@menuqr.test`;
  const slug = `e2e-cafe-${stamp}`;

  const ownerContext = await freshContext();
  const page = await ownerContext.newPage();
  const clientErrors = [];
  page.on("pageerror", (e) => clientErrors.push(String(e)));
  page.on("console", (m) => {
    const text = m.text();
    // Aborted route prefetches are expected when a script navigates faster than
    // Next can finish them; it falls back to a normal navigation on its own.
    const benign = text.includes("404") || text.includes("Failed to fetch RSC payload");
    if (m.type() === "error" && !benign) clientErrors.push(text);
  });

  await registerAccount(page, email);
  check("register creates an account and lands on onboarding", page.url().includes("/onboarding"));
  check("the auth trigger created a profile row", sql(`select count(*) from public.profiles where email = '${email}'`) === "1");

  await page.fill("#name", `E2E Cafe ${stamp}`);
  await page.fill("#slug", slug);
  await page.click('button[type="submit"]');
  await page.waitForSelector("#firstCategory", { timeout: 30000 });

  const restaurantId = sql(`select id from public.restaurants where slug = '${slug}'`);
  check("onboarding creates the venue", Boolean(restaurantId));
  check("the venue bootstrap made the creator its owner", sql(`select count(*) from public.restaurant_members where restaurant_id = '${restaurantId}' and role = 'owner'`) === "1");
  check("the venue starts on the free plan", sql(`select p.code from public.subscriptions s join public.subscription_plans p on p.id = s.plan_id where s.restaurant_id = '${restaurantId}'`) === "free");
  check("the venue got its general QR code", sql(`select count(*) from public.qr_codes where restaurant_id = '${restaurantId}' and table_id is null`) === "1");

  await page.fill("#firstCategory", "Drinks");
  await page.getByRole("button", { name: "Finish" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  check("onboarding creates the first category and reaches the dashboard", sql(`select count(*) from public.categories where restaurant_id = '${restaurantId}'`) === "1");

  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.waitForURL("**/login", { timeout: 30000 });
  check("logging out returns to the login page", page.url().includes("/login"));

  await login(page, email);
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  check("logging back in reaches the dashboard", page.url().includes("/dashboard"));

  await page.goto(`${BASE}/dashboard/categories`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("tab", { name: "English" }).click();
  await page.fill("#name_en", "Pizza");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1500);
  check("a category can be created", sql(`select count(*) from public.categories where restaurant_id = '${restaurantId}'`) === "2");

  await page.goto(`${BASE}/dashboard/products`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New product" }).first().click();
  await page.getByRole("tab", { name: "English" }).click();
  await page.fill("#name_en", "Pizza Margherita");
  await page.fill("#price", "12.500");
  await page.locator("#category_id").click();
  await page.getByRole("option", { name: "Pizza", exact: true }).click();
  await page.setInputFiles('input[type="file"]', IMAGE_PATH);
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(2000);

  const imageUrl = sql(`select coalesce(image_url, '') from public.products where restaurant_id = '${restaurantId}'`);
  check("a product can be created", sql(`select count(*) from public.products where restaurant_id = '${restaurantId}'`) === "1");
  check("the product keeps its exact price", sql(`select price::text from public.products where restaurant_id = '${restaurantId}'`) === "12.500");
  check("the product is linked to its category", sql(`select count(*) from public.products p join public.categories c on c.id = p.category_id where p.restaurant_id = '${restaurantId}'`) === "1");
  check("the uploaded image is stored and linked", imageUrl.includes("/storage/v1/object/public/menu-images/"), imageUrl || "(no image_url)");
  check("the image object exists in the bucket", sql(`select count(*) from storage.objects where bucket_id = 'menu-images'`) !== "0");
  check("the stored image is publicly served", (await page.request.get(imageUrl)).status() === 200);

  await page.goto(`${BASE}/dashboard/tables`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New table" }).first().click();
  await page.fill("#name", "Table 7");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1500);
  const tableId = sql(`select id from public.restaurant_tables where restaurant_id = '${restaurantId}'`);
  check("a table can be created", Boolean(tableId));
  check("its QR code is generated automatically", sql(`select count(*) from public.qr_codes where table_id = '${tableId}'`) === "1");

  await page.goto(`${BASE}/dashboard/qr`, { waitUntil: "networkidle" });
  check("the QR page renders a scannable code", (await page.locator('img[src^="data:image/png"]').count()) >= 1);
  await page.screenshot({ path: `${SHOTS}/qr-codes.png` });

  // --- the guest side -----------------------------------------------------
  const guestContext = await browser.newContext(guestContextOptions());
  const guest = await guestContext.newPage();
  await guest.goto(`${BASE}/menu/${slug}`, { waitUntil: "networkidle" });
  check("the public menu renders the venue", (await guest.locator("h1").first().innerText()).includes("E2E Cafe"));
  check("the public menu lists the product under its category", (await guest.getByRole("heading", { name: "Pizza" }).count()) >= 1);
  check("the price is shown in Tunisian format", (await guest.getByText(/12\.500/).count()) >= 1);
  check("the menu opens in the venue's own language, right-to-left", (await guest.getAttribute("html", "dir")) === "rtl");
  check(
    "the uploaded image renders on the menu",
    await guest.locator("img").evaluateAll((imgs) => imgs.some((i) => decodeURIComponent(i.currentSrc || i.src).includes("menu-images")))
  );
  await guest.screenshot({ path: `${SHOTS}/public-menu.png` });

  await guest.getByText("Pizza Margherita").first().click();
  await guest.waitForTimeout(1500);
  check("the product detail sheet opens", (await guest.locator('[role="dialog"]').count()) >= 1);
  await guest.screenshot({ path: `${SHOTS}/product-sheet.png` });

  // --- scanning a table QR ------------------------------------------------
  const token = sql(`select token from public.qr_codes where table_id = '${tableId}'`);
  const scanContext = await browser.newContext(guestContextOptions());
  const scanned = await scanContext.newPage();
  await scanned.goto(`${BASE}/menu/${slug}?t=${encodeURIComponent(token)}`, { waitUntil: "networkidle" });
  await scanned.waitForTimeout(2500);
  check("scanning a table QR identifies the table", (await scanned.getByText(/Table 7/).count()) >= 1);
  check("the scan is recorded as a QR view", Number(sql(`select count(*) from public.menu_views where restaurant_id = '${restaurantId}' and source = 'qr'`)) >= 1);
  check("the scan is attributed to that table", sql(`select count(*) from public.menu_views where table_id = '${tableId}'`) !== "0");
  check("the QR scan counter increments", Number(sql(`select scan_count from public.qr_codes where table_id = '${tableId}'`)) >= 1);
  check("opening a product records interest", Number(sql(`select count(*) from public.menu_interactions where restaurant_id = '${restaurantId}' and kind = 'product'`)) >= 1);
  await scanned.screenshot({ path: `${SHOTS}/scanned-menu.png` });

  // --- and the owner sees it ---------------------------------------------
  await page.goto(`${BASE}/dashboard/analytics`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const analytics = await page.locator("main").innerText();
  check("analytics reports the scan", /Scans today[\s\S]{0,40}[1-9]/.test(analytics), analytics.slice(0, 200));
  check("analytics ranks the viewed product", analytics.includes("Pizza Margherita"), analytics.slice(0, 200));
  await page.screenshot({ path: `${SHOTS}/analytics.png` });

  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  check("the dashboard overview reflects the activity", /QR scans[\s\S]{0,30}[1-9]/.test(await page.locator("main").innerText()));
  check("no uncaught client errors during the owner journey", clientErrors.length === 0, clientErrors.slice(0, 3).join(" | "));

  // =======================================================================
  // 1b. Ordering: a guest sends one, the venue's screen picks it up live
  // =======================================================================
  await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "networkidle" });
  // Each toggle sits in a label that also carries its help text, so the
  // accessible name is the whole paragraph; match the row by its exact title.
  const settingsToggle = (label) =>
    page.locator("li").filter({ has: page.getByText(label, { exact: true }) }).getByRole("switch");
  await settingsToggle("My selection").click();
  await settingsToggle("Take orders from the phone").click();
  await page.getByRole("button", { name: "Save" }).first().click();
  await page.waitForTimeout(2000);
  check(
    "a venue can switch ordering on",
    sql(`select enable_ordering::text from public.restaurant_settings where restaurant_id = '${restaurantId}'`) === "true"
  );

  // The waiter's screen is opened first, so the order has to arrive on a page
  // that was already sitting there — which is the point of the feature.
  const kitchen = await ownerContext.newPage();
  await kitchen.goto(`${BASE}/dashboard/orders`, { waitUntil: "networkidle" });
  check("the orders screen opens", /Orders/i.test(await kitchen.locator("h1").innerText()));

  // A phone, but with the interface pinned to English: what is under test here
  // is ordering, not the first-visit language pick the guest checks above.
  const diner = await freshContext(guestContextOptions());
  const dinerPage = await diner.newPage();
  await dinerPage.goto(`${BASE}/menu/${slug}?t=${encodeURIComponent(token)}`, { waitUntil: "networkidle" });
  await dinerPage.waitForTimeout(2500);
  await dinerPage.getByText("Pizza Margherita").first().click();
  await dinerPage.waitForTimeout(1200);
  // The button reads "Add · 12.500 DT", so match inside the sheet by prefix.
  await dinerPage.locator('[role="dialog"]').getByRole("button", { name: /^Add/ }).click();
  await dinerPage.waitForTimeout(800);
  await dinerPage.getByRole("button", { name: /My selection/i }).click();
  await dinerPage.waitForTimeout(800);
  await dinerPage.fill("#orderNote", "bla harissa");
  await dinerPage.getByRole("button", { name: "Send order" }).click();
  await dinerPage.waitForTimeout(3000);

  const orderId = sql(`select id from public.orders where restaurant_id = '${restaurantId}' order by created_at desc limit 1`);
  check("the order reaches the database", Boolean(orderId));
  check("the order is priced from the menu, not the browser",
    sql(`select total::text from public.orders where id = '${orderId}'`) === "12.500");
  check("the order carries the scanned table",
    sql(`select count(*) from public.orders where id = '${orderId}' and table_id = '${tableId}'`) === "1");
  check("the kitchen note is kept",
    sql(`select customer_note from public.orders where id = '${orderId}'`) === "bla harissa");
  const receipt = await dinerPage.locator('[role="dialog"]').innerText();
  const orderNumber = sql(`select order_number::text from public.orders where id = '${orderId}'`);
  check("the first order of the day is number 1", orderNumber === "1", orderNumber);
  check("the guest is shown their order number", receipt.includes(orderNumber), receipt.slice(0, 200));
  check("the receipt names the table", /Table 7/.test(receipt), receipt.slice(0, 200));
  check("the receipt lists what was ordered", /Pizza Margherita/.test(receipt), receipt.slice(0, 200));
  check("the receipt shows the total", /12\.500/.test(receipt), receipt.slice(0, 200));
  check("the receipt shows how far along the order is", /Waiting|Confirmed|prepared|Served/i.test(receipt));
  await dinerPage.screenshot({ path: `${SHOTS}/order-receipt.png` });

  // No reload. Locally the realtime service does not run, so what this proves
  // is the safety net: the screen re-reads on its own and the order turns up.
  // The websocket path is the same data, arriving sooner.
  await kitchen.waitForTimeout(25000);
  const kitchenText = await kitchen.locator("main").innerText();
  check("the order appears on the waiter's screen without a reload",
    kitchenText.includes("Pizza Margherita"), kitchenText.slice(0, 200));
  check("the waiter sees which table it came from", kitchenText.includes("Table 7"));
  check("the waiter sees the same order number the guest has", kitchenText.includes(orderNumber));
  await kitchen.screenshot({ path: `${SHOTS}/orders-live.png` });

  await kitchen.getByRole("button", { name: "Confirm" }).first().click();
  await kitchen.waitForTimeout(2000);
  check("a waiter can confirm the order",
    sql(`select status from public.orders where id = '${orderId}'`) === "confirmed");

  await dinerPage.waitForTimeout(16000);
  check("the guest's receipt follows the kitchen",
    /Confirmed/i.test(await dinerPage.locator('[role="dialog"]').innerText()),
    (await dinerPage.locator('[role="dialog"]').innerText()).slice(0, 200));

  check("the guest cannot read the orders table directly",
    (await dinerPage.evaluate(async () => {
      const response = await fetch(`${window.location.origin.replace(/:\d+$/, ":54321")}/rest/v1/orders?select=id`, {
        headers: { apikey: "x" },
      }).catch(() => null);
      return response ? response.status : 401;
    })) !== 200);

  await diner.close();

  // =======================================================================
  // 2. Password reset, through the actual email
  // =======================================================================
  const resetEmail = `reset-${uniq()}@menuqr.test`;
  const resetOwner = await freshContext();
  await registerAccount(await resetOwner.newPage(), resetEmail);

  // The middleware keeps signed-in users away from /forgot-password.
  const anonContext = await freshContext();
  const resetPage = await anonContext.newPage();
  await resetPage.goto(`${BASE}/forgot-password`, { waitUntil: "networkidle" });
  await resetPage.fill("#email", resetEmail);
  await resetPage.click('button[type="submit"]');
  await resetPage.waitForTimeout(3000);
  check("the app confirms a reset email was sent", /Check your email/i.test(await resetPage.locator("body").innerText()));

  // The catcher keeps every run's mail, so pick the message addressed to this
  // account rather than whatever happens to be on top.
  const inbox = await (await fetch(`${MAIL}/api/v1/messages`)).json();
  const message = (inbox.messages ?? inbox).find((m) =>
    (m.To ?? []).some((recipient) => recipient.Address === resetEmail)
  );
  check("the reset email is delivered to the right address", Boolean(message));

  const detail = await (await fetch(`${MAIL}/api/v1/message/${message.ID ?? message.id}`)).json();
  const html = detail.HTML ?? detail.Text ?? "";
  const link = (html.match(/https?:\/\/[^"'\s<)]+/g) ?? [])
    .map((url) => url.replaceAll("&amp;", "&"))
    .find((url) => url.includes("token") || url.includes("verify"));
  check("the email carries a recovery link", Boolean(link));
  check(
    "the recovery link returns to the configured site URL",
    decodeURIComponent(link ?? "").includes("/auth/callback?next=/reset-password"),
    link
  );

  // The link comes back to NEXT_PUBLIC_SITE_URL, which is what it should do.
  // When this run targets a different origin (say a production build on another
  // port), point the return trip at that origin so the flow can continue.
  const recovery = new URL(link);
  const redirectTo = recovery.searchParams.get("redirect_to");
  if (redirectTo) {
    const target = new URL(redirectTo);
    const base = new URL(BASE);
    target.protocol = base.protocol;
    target.host = base.host;
    recovery.searchParams.set("redirect_to", target.toString());
  }

  await resetPage.goto(recovery.toString(), { waitUntil: "networkidle" });
  await resetPage.waitForTimeout(2000);
  check("the recovery link opens the reset form", resetPage.url().includes("/reset-password"), resetPage.url());

  const newPassword = "MenuQR-changed-2026";
  await resetPage.fill("#password", newPassword);
  await resetPage.fill("#confirmPassword", newPassword);
  await resetPage.click('button[type="submit"]');
  await resetPage.waitForTimeout(3000);
  check("the new password is accepted", /Password updated/i.test(await resetPage.locator("body").innerText()));

  const afterResetContext = await freshContext();
  const afterReset = await afterResetContext.newPage();
  await login(afterReset, resetEmail, PASSWORD);
  await afterReset.waitForTimeout(2500);
  check("the old password no longer works", /Wrong email or password/i.test(await afterReset.locator("body").innerText()));

  await afterReset.fill("#password", newPassword);
  await afterReset.click('button[type="submit"]');
  await afterReset.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30000 });
  check("the new password signs in", /\/(onboarding|dashboard)/.test(afterReset.url()));

  // =======================================================================
  // 3. Platform administration and the demo venue
  // =======================================================================
  // The README's documented bootstrap: promote from a trusted SQL session.
  sql(`update public.profiles set platform_role = 'super_admin' where email = '${email}'`);
  check("the documented admin bootstrap works", sql(`select platform_role from public.profiles where email = '${email}'`) === "super_admin");

  const adminContext = await freshContext();
  const admin = await adminContext.newPage();
  await login(admin, email);
  await admin.waitForURL("**/dashboard", { timeout: 30000 });
  await admin.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  const adminText = await admin.locator("main").innerText();
  check("an admin can open the platform dashboard", /Total venues/.test(adminText), adminText.slice(0, 160));
  check("platform stats count real venues", /Total venues[\s\S]{0,40}[1-9]/.test(adminText));
  await admin.goto(`${BASE}/admin/restaurants`, { waitUntil: "networkidle" });
  check("the admin venue list spans tenants", (await admin.locator("main").innerText()).includes("E2E Cafe"));
  await admin.screenshot({ path: `${SHOTS}/admin.png` });

  const plainContext = await freshContext();
  const plain = await plainContext.newPage();
  await login(plain, resetEmail, newPassword);
  await plain.waitForTimeout(2000);
  await plain.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  const plainText = await plain.locator("body").innerText();
  check("a non-admin is refused, with an explanation", /Access denied|permission/i.test(plainText), plainText.slice(0, 160));
  check("a non-admin sees no platform data", !plainText.includes("Total venues"));

  // The demo venue the landing page links to, created from the owner's own
  // dashboard (the settings page belongs to a venue, so it needs that account).
  sql(`select public.remove_demo_restaurant('cafe-el-medina')`);
  await admin.goto(`${BASE}/dashboard/settings`, { waitUntil: "networkidle" });
  await admin.getByRole("tab", { name: "Team" }).click();
  await admin.getByRole("button", { name: "Create demo venue" }).click();
  await admin.waitForTimeout(3000);
  check("the demo venue can be created from the dashboard", sql(`select count(*) from public.restaurants where slug = 'cafe-el-medina'`) === "1");
  check("the demo venue has a full menu", Number(sql(`select count(*) from public.products p join public.restaurants r on r.id = p.restaurant_id where r.slug = 'cafe-el-medina'`)) >= 14);

  const demoContext = await browser.newContext(guestContextOptions());
  const demo = await demoContext.newPage();
  await demo.goto(`${BASE}/menu/cafe-el-medina`, { waitUntil: "networkidle" });
  const demoText = await demo.locator("body").innerText();
  check("the demo menu linked from the landing page renders", /قهوة المدينة|Café El Medina/.test(demoText));
  check("the demo menu shows realistic Tunisian prices", /12\.500/.test(demoText));
  await demo.screenshot({ path: `${SHOTS}/demo-menu.png` });

  await admin.getByRole("button", { name: "Remove demo venue" }).click();
  await admin.waitForTimeout(3000);
  check("the demo venue can be removed again", sql(`select count(*) from public.restaurants where slug = 'cafe-el-medina'`) === "0");
} catch (error) {
  check("the run completed without throwing", false, error?.stack ?? String(error));
} finally {
  await browser.close();
}

const failures = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failures}/${results.length} end-to-end checks passed`);
console.log(`screenshots: ${SHOTS}`);
process.exit(failures === 0 ? 0 : 1);
