#!/usr/bin/env node
/**
 * Renders every template the app serves into static preview assets.
 *
 * It drives the real /templates/[slug]/preview route — the same renderer,
 * sections, fonts and opening experience a guest sees — so a preview can
 * never drift from the product. Nothing here draws a mockup.
 *
 *   npm run previews                         # every template, app on :3000
 *   npm run previews -- --base http://localhost:3111
 *   npm run previews -- luxury-gold romantic # just these slugs
 *
 * Point it at a production build (`next build && next start`) rather than
 * `next dev`, so no dev overlay can land in a capture.
 *
 * Per template it writes to public/template-previews/<slug>/:
 *   sealed.webp  the invitation as it arrives, before it is opened
 *   cover.webp   the cover once opened — the invitation's face
 *   detail.webp  the photo page (or the first interior page if there is none)
 *   og.jpg       1200×630 social card composed from the three
 * and records dimensions + a blur placeholder in
 * src/lib/templates/preview-manifest.json.
 *
 * Determinism: fixed viewport and pixel ratio, reduced motion (every
 * transition collapses to its end state), a wait on document.fonts and on
 * document.getAnimations() rather than on a timer, demo data with a fixed
 * date, and no timestamps in the output. Two runs against the same build
 * produce identical files.
 */
import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "template-previews");
const PUBLIC_PREFIX = "/template-previews";
const MANIFEST = path.join(ROOT, "src", "lib", "templates", "preview-manifest.json");

/** A phone held in the hand: the size every invitation is designed for. */
const VIEWPORT = { width: 390, height: 844 };
const PIXEL_RATIO = 2;
const OG = { width: 1200, height: 630, margin: 42, gap: 44 };
const WEBP_QUALITY = 0.9;
const OPEN_LABEL = /افتحوا الدعوة|Ouvrir l'invitation|Open Invitation/;
const LOCALE_STORAGE_KEY = "flower-love-locale";

function parseArgs(argv) {
  const args = { base: "http://localhost:3000", locale: "ar", slugs: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") args.base = argv[++i].replace(/\/$/, "");
    else if (argv[i] === "--locale") args.locale = argv[++i];
    else args.slugs.push(argv[i]);
  }
  return args;
}

/** Playwright is a dev-time tool here, so it is not a project dependency. */
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {}
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    return createRequire(path.join(globalRoot, "_.js"))("playwright");
  } catch {}
  console.error("Playwright is not available. Install it with `npm i -D playwright && npx playwright install chromium`.");
  process.exit(1);
}

/** The templates the app actually serves — database or static fallback — in display order. */
async function discoverSlugs(base) {
  const res = await fetch(`${base}/templates`);
  if (!res.ok) throw new Error(`GET ${base}/templates → ${res.status}`);
  const html = await res.text();
  const slugs = [...html.matchAll(/\/templates\/([a-z0-9-]+)\/preview/g)].map((m) => m[1]);
  return [...new Set(slugs)];
}

/** Fonts decoded, images painted, every transition at its end state. */
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Only images the camera can see: lazy images further down never start
    // loading, and waiting on them would hang forever.
    const visible = [...document.images].filter((img) => {
      if (img.complete) return false;
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    });
    await Promise.race([
      Promise.all(visible.map((img) => new Promise((r) => (img.onload = img.onerror = r)))),
      new Promise((r) => setTimeout(r, 15000)),
    ]);
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      const running = document.getAnimations().filter((a) => a.playState === "running");
      if (running.length === 0) break;
      await Promise.race([Promise.all(running.map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 250))]);
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/** PNG → WebP plus a 10px-wide blur placeholder, encoded by Chromium itself (no native image deps). */
async function encode(encoder, png) {
  return encoder.evaluate(
    async ({ src, quality }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const full = document.createElement("canvas");
      full.width = img.naturalWidth;
      full.height = img.naturalHeight;
      full.getContext("2d").drawImage(img, 0, 0);

      const tiny = document.createElement("canvas");
      tiny.width = 10;
      tiny.height = Math.round((10 * img.naturalHeight) / img.naturalWidth);
      const ctx = tiny.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, tiny.width, tiny.height);

      return {
        webp: full.toDataURL("image/webp", quality),
        blurDataURL: tiny.toDataURL("image/webp", 0.6),
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    },
    { src: `data:image/png;base64,${png.toString("base64")}`, quality: WEBP_QUALITY },
  );
}

/**
 * The social card: the three renders side by side on the template's own
 * ground, each edged with a hairline in its accent. No added type — the
 * link title already carries the name, in whichever language shared it.
 */
async function composeOg(encoder, pngs, colors) {
  return encoder.evaluate(
    async ({ sources, colors, og, viewport }) => {
      const canvas = document.createElement("canvas");
      canvas.width = og.width;
      canvas.height = og.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, og.width, og.height);

      const h = og.height - og.margin * 2;
      const w = Math.round((h * viewport.width) / viewport.height);
      let x = Math.round((og.width - (w * sources.length + og.gap * (sources.length - 1))) / 2);
      ctx.imageSmoothingQuality = "high";
      for (const src of sources) {
        const img = new Image();
        img.src = src;
        await img.decode();
        ctx.drawImage(img, x, og.margin, w, h);
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, og.margin + 0.5, w - 1, h - 1);
        ctx.globalAlpha = 1;
        x += w + og.gap;
      }
      return canvas.toDataURL("image/jpeg", 0.9);
    },
    {
      sources: pngs.map((png) => `data:image/png;base64,${png.toString("base64")}`),
      colors,
      og: OG,
      viewport: VIEWPORT,
    },
  );
}

const fromDataUrl = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");

async function renderTemplate(browser, encoder, { base, locale }, slug) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: PIXEL_RATIO,
    locale,
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  await context.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [LOCALE_STORAGE_KEY, locale],
  );
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => msg.type() === "error" && problems.push(`console: ${msg.text()}`));
  page.on("requestfailed", (req) => problems.push(`requestfailed: ${req.url()} (${req.failure()?.errorText})`));

  const response = await page.goto(`${base}/templates/${slug}/preview`, { waitUntil: "networkidle" });
  if (!response || !response.ok()) throw new Error(`preview route returned ${response?.status()}`);
  await page.addStyleTag({ content: "[data-preview-chrome]{display:none!important}" });
  await settle(page);

  const colors = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector("[data-invitation]"));
    return { background: s.getPropertyValue("--inv-bg").trim(), primary: s.getPropertyValue("--inv-primary").trim() };
  });

  const sealed = await page.screenshot({ type: "png" });

  const open = page.getByRole("button", { name: OPEN_LABEL });
  if ((await open.count()) > 0) await open.first().click();
  await settle(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
  const cover = await page.screenshot({ type: "png" });

  const hasInterior = await page.evaluate(() => {
    const sections = [...document.querySelectorAll("[data-invitation] > section")];
    // Prefer the photo page: every template mounts photographs its own way,
    // so it says more about a template than any page of set text.
    const target = sections.find((s, i) => i > 0 && s.querySelector("img")) ?? sections[1];
    if (!target) return false;
    target.scrollIntoView({ block: "start" });
    return true;
  });
  await settle(page);
  const detail = hasInterior ? await page.screenshot({ type: "png" }) : cover;

  await context.close();

  const dir = path.join(OUT_DIR, slug);
  await mkdir(dir, { recursive: true });
  const entry = { background: colors.background, primary: colors.primary };
  for (const [name, png] of Object.entries({ sealed, cover, detail })) {
    const { webp, ...meta } = await encode(encoder, png);
    await writeFile(path.join(dir, `${name}.webp`), fromDataUrl(webp));
    entry[name] = { src: `${PUBLIC_PREFIX}/${slug}/${name}.webp`, ...meta };
  }
  await writeFile(path.join(dir, "og.jpg"), fromDataUrl(await composeOg(encoder, [sealed, cover, detail], colors)));
  entry.og = { src: `${PUBLIC_PREFIX}/${slug}/og.jpg`, width: OG.width, height: OG.height };

  return { entry, problems };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slugs = args.slugs.length ? args.slugs : await discoverSlugs(args.base);
  if (slugs.length === 0) throw new Error("No templates found — is the app running at " + args.base + "?");

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();
  const encoder = await (await browser.newContext()).newPage();

  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {}

  let failed = 0;
  for (const slug of slugs) {
    try {
      const { entry, problems } = await renderTemplate(browser, encoder, args, slug);
      manifest[slug] = entry;
      console.log(`✓ ${slug}`);
      for (const p of problems) console.log(`    ! ${p}`);
      if (problems.length) failed++;
    } catch (err) {
      failed++;
      console.error(`✗ ${slug}: ${err.message}`);
    }
  }
  await browser.close();

  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`\n${slugs.length - failed}/${slugs.length} templates rendered cleanly → ${path.relative(ROOT, OUT_DIR)}`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
