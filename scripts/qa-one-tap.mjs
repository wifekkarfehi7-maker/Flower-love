#!/usr/bin/env node
/**
 * One-tap opening QA: URL → cover → ONE tap → opening animation → content.
 *
 *   node scripts/qa-one-tap.mjs --base http://localhost:3200 [--qa-routes] [--only flow,reduced,audio,early] [--out dir]
 *
 * Point it at a production build (`next build && next start`). Every template
 * is tested through its real preview route. With `--qa-routes` the server must
 * also run with ENABLE_QA_ROUTES=1: the bare /qa/invitation/[slug] page adds
 * what a preview cannot have — a music track, and no photos at all.
 *
 * Every run taps exactly once and never again. It records how long after the
 * tap the opening starts, when the opening layer stops blocking, and whether
 * the invitation's content is then reachable. Three extra suites cover:
 *   audio   – a working, missing, hanging and refused track must never stop the opening;
 *   early   – a tap that lands before hydration on a slow phone connection;
 *   reduced – prefers-reduced-motion still opens on one tap.
 *
 * Chromium only (desktop, and Android Chrome by device emulation). iOS Safari
 * needs WebKit, which this script does not drive: see the manual checklist.
 */
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const args = { base: "http://localhost:3000", qaRoutes: false, out: null, only: null };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--base") args.base = process.argv[++i].replace(/\/$/, "");
  else if (a === "--qa-routes") args.qaRoutes = true;
  else if (a === "--out") args.out = process.argv[++i];
  else if (a === "--only") args.only = process.argv[++i];
}
const want = (suite) => !args.only || args.only.split(",").includes(suite);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {}
  const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
  return createRequire(path.join(globalRoot, "_.js"))("playwright");
}
const { chromium, devices } = await loadPlaywright();

const TEMPLATES = ["luxury-gold", "elegant-white", "floral", "romantic", "modern", "black-gold", "traditional-arabic", "minimal"];
/** The cover each template must render: its named layout, or the classic cover. */
const EXPECTED_COVER = { modern: "editorial", "traditional-arabic": "arch", "black-gold": "midnight" };
const OPEN_LABEL = { ar: "افتحوا الدعوة", fr: "Ouvrir l'invitation", en: "Open Invitation" };
const GROOM = "محمد";
const DEVICES = {
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  android: { ...devices["Pixel 7"] },
};

const surfaces = [
  ...TEMPLATES.map((slug) => ({ name: slug, slug, url: `/templates/${slug}/preview` })),
  // No cover photo and no gallery: the photo-led layouts' designed fallbacks.
  ...(args.qaRoutes ? ["modern", "black-gold"].map((slug) => ({ name: `${slug}:no-photo`, slug, url: `/qa/invitation/${slug}?photo=0` })) : []),
];
const qaSurface = (slug) => ({ name: `${slug}:qa`, slug, url: `/qa/invitation/${slug}` });

const browser = await chromium.launch();
const results = [];

async function newPage(device, { locale = "ar", reduced = false } = {}) {
  const context = await browser.newContext({ ...DEVICES[device], reducedMotion: reduced ? "reduce" : "no-preference" });
  await context.addInitScript((l) => {
    localStorage.setItem("flower-love-locale", l);
    // Instrumentation: when the guest's tap happens, and when the opening first moves.
    window.__qa = { taps: 0, tapAt: null, startAt: null, playCalls: [] };
    addEventListener("click", () => {
      window.__qa.taps++;
      window.__qa.tapAt ??= performance.now();
      window.__qa.inTap = true;
      setTimeout(() => (window.__qa.inTap = false), 0);
    }, true);
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__qa.playCalls.push({ at: performance.now(), inTapTask: !!window.__qa.inTap, activation: navigator.userActivation?.isActive ?? null });
      return (window.__qa.refusePlay ? Promise.reject(new DOMException("refused by test", "NotAllowedError")) : play.call(this));
    };
  }, locale);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/qa-music/.test(m.text()) && errors.push(m.text()));
  return { context, page, errors };
}

/** Watches the opening layer from the tap onwards: first moving frame, then the frame it stops blocking. */
function armWatch(page) {
  return page.evaluate(() => {
    const layer = document.querySelector("[data-invitation] button[aria-label]")?.closest("div.z-20");
    const qa = window.__qa;
    const tick = () => {
      if (qa.tapAt == null) return requestAnimationFrame(tick);
      const moving = document.getAnimations().some((a) => a.playState === "running" && document.querySelector("[data-invitation]")?.contains(a.effect?.target ?? null));
      const cs = layer ? getComputedStyle(layer) : null;
      const released = !layer || !layer.isConnected || cs.pointerEvents === "none";
      if (qa.startAt == null && (moving || released)) qa.startAt = performance.now();
      if (released && cs && (!layer.isConnected || Number(cs.opacity) === 0)) { qa.revealedAt = performance.now(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function hydrated(page) {
  return page.evaluate(() => {
    const b = document.querySelector("[data-invitation] button[aria-label]");
    return !!b && Object.keys(b).some((k) => k.startsWith("__reactFiber"));
  });
}

async function tapOnce(page, device, locale) {
  const seal = page.getByRole("button", { name: OPEN_LABEL[locale] });
  if (device === "android") await seal.tap();
  else await seal.click();
}

/** After the reveal: nothing covers the page, the names are visible, and the page's own content is in the accessibility tree. */
async function contentState(page) {
  return page.evaluate(({ groom }) => {
    const layer = document.querySelector("[data-invitation] div.z-20");
    const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    const blocked = !!layer && layer.contains(hit);
    // The element whose own text holds the groom's name (Midnight sets both names, and و, in one line).
    const names = [...document.querySelectorAll("[data-invitation] *")].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim() === groom));
    let visible = false;
    for (let el = names; el; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) { visible = false; break; }
      visible = true;
    }
    const sections = document.querySelectorAll("[data-invitation] section").length;
    const coverLayout = document.querySelector("[data-invitation] section[data-cover-layout]")?.getAttribute("data-cover-layout") ?? "classic";
    return { blocked, namesVisible: visible, sections, contentRendered: sections > 1, coverLayout, dialog: !!document.querySelector("[role=dialog],[aria-modal=true]") };
  }, { groom: GROOM });
}

async function runFlow(surface, device, { locale = "ar", reduced = false, music = null, refusePlay = false } = {}) {
  const { context, page, errors } = await newPage(device, { locale, reduced });
  if (music) {
    await page.route((u) => u.pathname === "/qa-music.wav", (route) => {
      if (music === "ok") return route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() });
      if (music === "missing") return route.fulfill({ status: 404, body: "" });
      /* "hang": never answer */
    });
  }
  const url = `${args.base}${surface.url}${music ? `${surface.url.includes("?") ? "&" : "?"}music=/qa-music.wav` : ""}`;
  const t0 = Date.now();
  await page.goto(url, { waitUntil: "load" });
  if (refusePlay) await page.evaluate(() => (window.__qa.refusePlay = true));
  await page.getByRole("button", { name: OPEN_LABEL[locale] }).waitFor({ state: "visible" });
  const coverReadyMs = Date.now() - t0;
  const readyBeforeTap = await hydrated(page);
  await armWatch(page);
  await tapOnce(page, device, locale);
  await page.waitForFunction(() => window.__qa.revealedAt != null, null, { timeout: 8000 }).catch(() => {});
  // Let the reveal's own motion finish before judging what the guest can see.
  await page.waitForTimeout(reduced ? 300 : 3800);
  const qa = await page.evaluate(() => window.__qa);
  const content = await contentState(page);
  const audio = music ? await page.evaluate(() => { const a = document.querySelector("audio"); return a ? { paused: a.paused, calls: window.__qa.playCalls } : null; }) : null;
  await context.close();
  // A missing track is the point of that case: its 404 is expected, not a page error.
  if (music === "missing") errors.splice(0, errors.length, ...errors.filter((e) => !/status of 404/.test(e)));
  const r = {
    surface: surface.name, device, locale, reduced, music: music ? `${music}${refusePlay ? "+refused" : ""}` : null,
    coverReadyMs, readyBeforeTap, taps: qa.taps,
    startMs: qa.startAt != null ? +(qa.startAt - qa.tapAt).toFixed(1) : null,
    revealMs: qa.revealedAt != null ? Math.round(qa.revealedAt - qa.tapAt) : null,
    ...content, audio, errors,
  };
  r.expectedCover = EXPECTED_COVER[surface.slug] ?? "classic";
  r.pass = r.taps === 1 && r.startMs != null && r.startMs <= 100 && r.revealMs != null && !r.blocked && r.contentRendered && r.namesVisible && r.coverLayout === r.expectedCover && !r.dialog && errors.length === 0;
  return r;
}

/** Slow phone: 1.6 Mb/s, 150 ms RTT, 6× CPU. Tap the seal the moment it is painted, once. */
async function runEarly(surface) {
  const { context, page, errors } = await newPage("android");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  const t0 = Date.now();
  await page.goto(`${args.base}${surface.url}`, { waitUntil: "commit" });
  const seal = page.getByRole("button", { name: OPEN_LABEL.ar });
  await seal.waitFor({ state: "visible", timeout: 60000 });
  const visibleMs = Date.now() - t0;
  const box = await seal.boundingBox();
  const hydratedAtTap = await hydrated(page);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(() => Object.keys(document.querySelector("[data-invitation] button[aria-label]") ?? {}).some((k) => k.startsWith("__reactFiber")), null, { timeout: 60000 }).catch(() => {});
  const hydratedMs = Date.now() - t0;
  const opened = await page.waitForFunction(() => {
    const l = document.querySelector("[data-invitation] div.z-20");
    return !l || getComputedStyle(l).pointerEvents === "none";
  }, null, { timeout: 15000 }).then(() => true, () => false);
  const taps = await page.evaluate(() => window.__qa.taps);
  await context.close();
  return { surface: surface.name, visibleMs, hydratedMs, deadWindowMs: hydratedMs - visibleMs, hydratedAtTap, taps, openedOnOneTap: opened, errors, pass: opened && taps === 1 };
}

function silentWav(seconds = 1, rate = 8000) {
  const n = seconds * rate, b = Buffer.alloc(44 + n);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28);
  b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write("data", 36); b.writeUInt32LE(n, 40); b.fill(128, 44);
  return b;
}

const log = (r) => console.log(`${r.pass ? "PASS" : "FAIL"}  ${JSON.stringify(r)}`);

// 1. The flow itself: every surface, every locale, desktop and Android.
if (want("flow")) for (const s of surfaces) for (const device of Object.keys(DEVICES)) for (const locale of ["ar", "fr", "en"]) {
  const r = await runFlow(s, device, { locale }); results.push({ suite: "flow", ...r }); log(r);
}
// 2. Reduced motion still opens on one tap.
if (want("reduced")) for (const s of surfaces) for (const device of Object.keys(DEVICES)) {
  const r = await runFlow(s, device, { reduced: true }); results.push({ suite: "reduced", ...r }); log(r);
}
// 3. Audio never blocks the opening: the three new covers and one classic cover, through the real MusicPlayer.
if (want("audio") && args.qaRoutes) for (const s of ["modern", "traditional-arabic", "black-gold", "luxury-gold"].map(qaSurface)) for (const device of Object.keys(DEVICES)) {
  for (const [music, refusePlay] of [["ok", false], ["missing", false], ["hang", false], ["ok", true]]) {
    const r = await runFlow(s, device, { music, refusePlay }); results.push({ suite: "audio", ...r }); log(r);
  }
}
// 4. A tap before hydration on a slow phone.
if (want("early")) for (const s of surfaces.filter((x) => TEMPLATES.includes(x.name))) {
  const r = await runEarly(s); results.push({ suite: "early", ...r }); log(r);
}

await browser.close();
const summary = {};
for (const r of results) {
  const k = r.suite; summary[k] ??= { runs: 0, pass: 0 }; summary[k].runs++; if (r.pass) summary[k].pass++;
}
console.log("\nSUMMARY", JSON.stringify(summary));
if (args.out) {
  await mkdir(args.out, { recursive: true });
  await writeFile(path.join(args.out, "one-tap-qa.json"), JSON.stringify({ summary, results }, null, 2));
}
process.exitCode = results.every((r) => r.pass) ? 0 : 1;
