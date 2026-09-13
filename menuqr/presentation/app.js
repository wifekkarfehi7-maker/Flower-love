/* ===========================================================================
   MenuQR — presentation engine
   Plain ES5-compatible JS, no build step, no dependencies. Opens from the
   file system or from any static server.
   =========================================================================== */
(function () {
  "use strict";

  var LANGS = ["ar", "fr"];
  var DEFAULT_LANG = "fr";
  var STORE_KEY = "menuqr.deck.lang";

  var html = document.documentElement;
  var body = document.body;
  var deck = document.getElementById("deck");
  var slides = [].slice.call(deck.querySelectorAll("[data-slide]"));
  var railEl = document.querySelector("[data-rail]");
  var overviewEl = document.querySelector("[data-overview]");
  var overviewGrid = document.querySelector("[data-overview-grid]");
  var currentEl = document.querySelector("[data-current]");
  var totalEl = document.querySelector("[data-total]");
  var progressEl = document.querySelector(".progress__bar");
  var prevBtn = document.querySelector('[data-nav="prev"]');
  var nextBtn = document.querySelector('[data-nav="next"]');

  var lang = DEFAULT_LANG;
  var index = 0;
  var timers = [];
  var leaveTimer = null;

  /* ─────────────── helpers ─────────────── */

  function dict() { return CONTENT[lang]; }

  function t(path) {
    var node = dict(), parts = String(path).split("."), i;
    for (i = 0; i < parts.length; i++) {
      if (node == null) return "";
      node = node[parts[i]];
    }
    return node == null ? "" : node;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clearTimers() {
    while (timers.length) clearTimeout(timers.pop());
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* private mode, blocked storage — the deck works anyway */ }
    return null;
  }

  function isRTL() { return dict().dir === "rtl"; }

  /* wa.me link, with the opening message already written in the right language */
  function waHref() {
    var msg = t("common.waMsg");
    var base = "https://wa.me/" + BRAND.whatsapp;
    return msg ? base + "?text=" + encodeURIComponent(msg) : base;
  }

  /* ─────────────── the phone menu ─────────────── */

  var CART_BASE = 2;
  var cart = { count: CART_BASE, total: 0 };

  function priceToNumber(p) { return parseFloat(String(p).replace(",", ".")) || 0; }
  function formatPrice(n) {
    var s = n.toFixed(3).replace(".", ",");
    return s;
  }

  function countLabel(n) {
    var k = n === 1 ? "one" : n === 2 ? "two" : n <= 10 ? "few" : "many";
    return String(t("menu.count." + k)).replace("{n}", n);
  }

  function dishesOf(catId) {
    return MENU.dishes.filter(function (d) { return d.cat === catId; });
  }

  /* Builds the whole menu screen inside a phone. `catId` selects the open
     category; `limit` trims the list for the smaller phones. */
  function renderMenu(mount, catId, limit) {
    var d = dict();
    var app = el("div", "menuapp");
    app.setAttribute("lang", d.htmlLang);
    app.setAttribute("dir", d.dir);

    var cover = el("div", "menuapp__cover");
    var langPill = el("div", "menuapp__lang");
    var pillAr = el("span", lang === "ar" ? "on" : "", "AR");
    var pillFr = el("span", lang === "fr" ? "on" : "", "FR");
    langPill.appendChild(pillAr);
    langPill.appendChild(pillFr);
    cover.appendChild(langPill);
    app.appendChild(cover);

    var id = el("div", "menuapp__id");
    id.appendChild(el("span", "menuapp__logo", "EM"));
    var name = el("div", "menuapp__name");
    name.appendChild(el("b", "", "Café El Medina"));
    name.appendChild(el("em", "", t("menu.venueTag")));
    id.appendChild(name);
    app.appendChild(id);

    var cats = el("div", "menuapp__cats");
    MENU.cats.forEach(function (c) {
      var s = el("span", c.id === catId ? "on" : "", t(c.key));
      s.setAttribute("data-cat", c.id);
      cats.appendChild(s);
    });
    app.appendChild(cats);

    var list = el("div", "menuapp__list");
    var items = dishesOf(catId);
    if (limit) items = items.slice(0, limit);
    items.forEach(function (item, i) {
      var art = el("article", "dish");
      art.style.setProperty("--i", i);

      var photo = el("span", "dish__photo ph ph--" + item.ph);
      if (item.hot) photo.appendChild(el("span", "dish__badge", t("menu.featured")));
      art.appendChild(photo);

      var bodyEl = el("div", "dish__body");
      bodyEl.appendChild(el("h4", "", item[lang].n));
      bodyEl.appendChild(el("p", "", item[lang].d));
      var foot = el("div", "dish__foot");
      var price = el("span", "dish__price");
      price.appendChild(document.createTextNode(item.price + " " + t("menu.currency")));
      foot.appendChild(price);
      var add = el("span", "dish__add", "+");
      add.setAttribute("data-price", item.price);
      foot.appendChild(add);
      bodyEl.appendChild(foot);
      art.appendChild(bodyEl);
      list.appendChild(art);
    });
    app.appendChild(list);

    var bar = el("div", "menuapp__bar");
    var left = el("div");
    left.appendChild(el("b", "", t("menu.orderTitle")));
    left.appendChild(orderSummary());
    bar.appendChild(left);
    bar.appendChild(el("span", "menuapp__send", t("menu.send")));
    app.appendChild(bar);

    mount.innerHTML = "";
    mount.appendChild(app);
    return app;
  }

  function resetCart() {
    cart.count = CART_BASE;
    cart.total = priceToNumber("12,500") + priceToNumber("3,500"); /* pizza + cappuccino */
  }

  /* Count and total as separate runs with a drawn separator: a "·" between an
     Arabic word and a Latin number is bidi-neutral and lands on the wrong side. */
  function orderSummary() {
    var cnt = el("em", "menuapp__count");
    cnt.appendChild(el("span", "", countLabel(cart.count)));
    cnt.appendChild(el("i", "menuapp__sep"));
    var total = document.createElement("bdi");
    total.textContent = formatPrice(cart.total) + " " + t("menu.currency");
    cnt.appendChild(total);
    return cnt;
  }

  function paintCart(scope) {
    [].forEach.call(scope.querySelectorAll(".menuapp__count"), function (n) {
      n.parentNode.replaceChild(orderSummary(), n);
    });
  }

  function mountAllMenus() {
    resetCart();
    var hero = document.querySelector('[data-menu-mount="hero"]');
    var full = document.querySelector('[data-menu-mount="full"]');
    var night = document.querySelector('[data-menu-mount="night"]');
    if (hero) renderMenu(hero, "pizza", 3);
    if (night) renderMenu(night, "drinks", 3);
    if (full) renderMenu(full, "breakfast", 4);
  }

  /* Slide 5: the menu browses itself — categories change, a dish is added. */
  var showcaseStep = 0;
  function runShowcase() {
    var mount = document.querySelector('[data-menu-mount="full"]');
    if (!mount) return;
    var order = ["breakfast", "pizza", "sandwich", "drinks", "desserts"];

    function tick() {
      showcaseStep++;
      var cat = order[showcaseStep % order.length];
      renderMenu(mount, cat, 4);

      /* every other category, a product is added to the order */
      if (showcaseStep % 2 === 0) {
        later(function () {
          var add = mount.querySelector(".dish:nth-child(1) .dish__add");
          if (!add) return;
          add.classList.add("is-hit");
          cart.count += 1;
          cart.total += priceToNumber(add.getAttribute("data-price"));
          later(function () { paintCart(mount); }, 260);
        }, 1150);
      }
      later(tick, 3600);
    }
    later(tick, 2400);
  }

  /* Slide 6: a price is edited and saved, live. */
  function runDashboard() {
    var val = document.querySelector(".dash__val");
    var toast = document.querySelector(".dash__toast");
    if (!val || !toast) return;
    val.textContent = "7,500";
    val.classList.remove("is-changed");
    toast.classList.remove("is-on");

    later(function () {
      val.textContent = "8,000";
      val.classList.add("is-changed");
    }, 1400);
    later(function () { toast.classList.add("is-on"); }, 2100);
    later(function () { toast.classList.remove("is-on"); }, 6400);
  }

  function runSlideScript(i) {
    clearTimers();
    if (i === 4) { resetCart(); runShowcase(); }
    if (i === 5) runDashboard();
  }

  /* ─────────────── i18n ─────────────── */

  function applyLanguage(next, opts) {
    lang = LANGS.indexOf(next) >= 0 ? next : DEFAULT_LANG;
    var d = dict();

    html.setAttribute("lang", d.htmlLang);
    html.setAttribute("dir", d.dir);

    [].forEach.call(document.querySelectorAll("[data-i18n]"), function (n) {
      n.textContent = t(n.getAttribute("data-i18n"));
    });
    [].forEach.call(document.querySelectorAll("[data-i18n-label]"), function (n) {
      n.setAttribute("aria-label", t(n.getAttribute("data-i18n-label")));
    });
    [].forEach.call(document.querySelectorAll("[data-wa]"), function (n) {
      n.setAttribute("href", waHref());
      n.setAttribute("target", "_blank");
      n.setAttribute("rel", "noopener");
    });
    [].forEach.call(document.querySelectorAll(".langswitch__btn"), function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-lang") === lang);
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });

    buildRail();
    buildOverview();
    mountAllMenus();
    store(STORE_KEY, lang);

    if (!opts || !opts.silent) {
      runSlideScript(index);
      syncHash();
    }
  }

  /* ─────────────── navigation ─────────────── */

  function buildRail() {
    railEl.innerHTML = "";
    slides.forEach(function (s, i) {
      var b = el("button", "rail__dot" + (i === index ? " is-on" : ""));
      b.type = "button";
      if (i === index) b.setAttribute("aria-current", "true");
      b.setAttribute("aria-label", (i + 1) + ". " + t(s.getAttribute("data-title")));
      b.title = t(s.getAttribute("data-title"));
      b.addEventListener("click", function () { go(i); });
      railEl.appendChild(b);
    });
  }

  function buildOverview() {
    overviewGrid.innerHTML = "";
    slides.forEach(function (s, i) {
      var li = document.createElement("li");
      var b = el("button", i === index ? "is-on" : "");
      b.type = "button";
      b.appendChild(el("i", "", (i + 1 < 10 ? "0" : "") + (i + 1)));
      b.appendChild(el("span", "", t(s.getAttribute("data-title"))));
      b.addEventListener("click", function () { closeOverview(); go(i); });
      li.appendChild(b);
      overviewGrid.appendChild(li);
    });
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function syncHash() {
    var h = "#/" + lang + "/" + (index + 1);
    if (window.location.hash !== h) {
      history.replaceState(null, "", h);
    }
  }

  function go(next, opts) {
    next = Math.max(0, Math.min(slides.length - 1, next));
    var back = next < index;
    var prev = slides[index];

    /* direction of the push, mirrored in RTL */
    var dx = (back ? -42 : 42) * (isRTL() ? -1 : 1);
    slides.forEach(function (s) { s.style.setProperty("--dx", dx + "px"); });

    /* The leaving class has its own timer: runSlideScript() clears the slide
       timers below, and a cleanup left in that pool would never fire — the old
       slide would keep `is-leaving` and come back offset the next time. */
    clearTimeout(leaveTimer);
    slides.forEach(function (s) { s.classList.remove("is-leaving"); });
    if (prev && prev !== slides[next]) {
      prev.classList.remove("is-active");
      prev.classList.add("is-leaving");
      leaveTimer = setTimeout(function () { prev.classList.remove("is-leaving"); }, 520);
    }

    index = next;
    var cur = slides[index];
    cur.classList.add("is-active");
    cur.scrollTop = 0;

    body.setAttribute("data-theme", cur.classList.contains("slide--dark") ? "dark" : "light");
    currentEl.textContent = pad(index + 1);
    progressEl.style.width = ((index + 1) / slides.length * 100) + "%";
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;

    [].forEach.call(railEl.children, function (d, i) {
      d.classList.toggle("is-on", i === index);
      if (i === index) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
    });
    [].forEach.call(overviewGrid.querySelectorAll("button"), function (b, i) { b.classList.toggle("is-on", i === index); });

    runSlideScript(index);
    if (!opts || !opts.silent) syncHash();
  }

  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  /* ─────────────── overview & fullscreen ─────────────── */

  function openOverview() { overviewEl.hidden = false; }
  function closeOverview() { overviewEl.hidden = true; }
  function toggleOverview() { overviewEl.hidden ? openOverview() : closeOverview(); }

  function toggleFullscreen() {
    var doc = document;
    var root = doc.documentElement;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      (root.requestFullscreen || root.webkitRequestFullscreen || function () {}).call(root);
    } else {
      (doc.exitFullscreen || doc.webkitExitFullscreen || function () {}).call(doc);
    }
  }

  /* ─────────────── closing slide: real links only ─────────────── */

  function buildBrandSlots() {
    var links = document.querySelector("[data-links-slot]");
    if (links) {
      links.innerHTML = "";
      [
        { url: BRAND.website, label: BRAND.website ? BRAND.website.replace(/^https?:\/\//, "") : "" },
        { url: BRAND.instagram, label: "Instagram" },
        { url: BRAND.facebook, label: "Facebook" }
      ].forEach(function (item) {
        if (!item.url) return;               /* nothing invented: empty stays empty */
        var li = document.createElement("li");
        var a = el("a", "", item.label);
        a.href = item.url;
        a.target = "_blank";
        a.rel = "noopener";
        li.appendChild(a);
        links.appendChild(li);
      });
    }

    var logoSlot = document.querySelector("[data-logo-slot]");
    if (logoSlot && BRAND.logo) {
      logoSlot.innerHTML = "";
      var img = document.createElement("img");
      img.src = BRAND.logo;
      img.alt = BRAND.name;
      logoSlot.appendChild(img);
    }

    [].forEach.call(document.querySelectorAll(".closing__name, .brand__name"), function (n) {
      n.textContent = BRAND.name;
    });
    [].forEach.call(document.querySelectorAll('[dir="ltr"]'), function (n) {
      if (n.textContent.indexOf("+216") === 0) n.textContent = BRAND.whatsappDisplay;
    });
  }

  /* ─────────────── wiring ─────────────── */

  function staggerAnimations() {
    slides.forEach(function (s) {
      [].forEach.call(s.querySelectorAll("[data-anim]"), function (n, i) {
        n.style.setProperty("--d", (i * 95) + "ms");
      });
    });
  }

  function readHash() {
    var m = /^#\/(ar|fr)\/(\d+)$/.exec(window.location.hash || "");
    if (!m) return null;
    return { lang: m[1], slide: Math.max(1, Math.min(slides.length, parseInt(m[2], 10))) - 1 };
  }

  function bind() {
    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    [].forEach.call(document.querySelectorAll(".langswitch__btn"), function (b) {
      b.addEventListener("click", function () { applyLanguage(b.getAttribute("data-lang")); });
    });
    [].forEach.call(document.querySelectorAll("[data-goto]"), function (b) {
      b.addEventListener("click", function () { go(parseInt(b.getAttribute("data-goto"), 10) - 1); });
    });
    [].forEach.call(document.querySelectorAll('[data-action="overview"]'), function (b) {
      b.addEventListener("click", toggleOverview);
    });
    [].forEach.call(document.querySelectorAll('[data-action="close-overview"]'), function (b) {
      b.addEventListener("click", closeOverview);
    });
    [].forEach.call(document.querySelectorAll('[data-action="fullscreen"]'), function (b) {
      b.addEventListener("click", toggleFullscreen);
    });
    overviewEl.addEventListener("click", function (e) { if (e.target === overviewEl) closeOverview(); });

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;

      if (k === "Escape") {
        if (!overviewEl.hidden) { closeOverview(); e.preventDefault(); return; }
        if (document.fullscreenElement || document.webkitFullscreenElement) { toggleFullscreen(); e.preventDefault(); }
        return;
      }
      if (!overviewEl.hidden && k !== "o" && k !== "O") return;

      switch (k) {
        case "ArrowRight": isRTL() ? prev() : next(); e.preventDefault(); break;
        case "ArrowLeft":  isRTL() ? next() : prev(); e.preventDefault(); break;
        case "ArrowDown":
        case "PageDown":
        case " ":
        case "Spacebar":
        case "Enter":      next(); e.preventDefault(); break;
        case "ArrowUp":
        case "PageUp":     prev(); e.preventDefault(); break;
        case "Home":       go(0); e.preventDefault(); break;
        case "End":        go(slides.length - 1); e.preventDefault(); break;
        case "f": case "F": toggleFullscreen(); e.preventDefault(); break;
        case "o": case "O": toggleOverview(); e.preventDefault(); break;
        case "a": case "A": applyLanguage("ar"); e.preventDefault(); break;
        case "l": case "L": applyLanguage("fr"); e.preventDefault(); break;
      }
    });

    /* Swipe: horizontal navigates, vertical is left to the slide's own scroll */
    var sx = 0, sy = 0, tracking = false;
    deck.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      tracking = true;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    deck.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - sx;
      var dy = touch.clientY - sy;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      var forward = isRTL() ? dx > 0 : dx < 0;
      forward ? next() : prev();
    }, { passive: true });

    window.addEventListener("hashchange", function () {
      var h = readHash();
      if (!h) return;
      if (h.lang !== lang) applyLanguage(h.lang, { silent: true });
      if (h.slide !== index) go(h.slide, { silent: true });
    });
  }

  /* ─────────────── boot ─────────────── */

  function init() {
    totalEl.textContent = slides.length;
    staggerAnimations();
    buildBrandSlots();

    var fromHash = readHash();
    var saved = store(STORE_KEY);
    var startLang = (fromHash && fromHash.lang) || (LANGS.indexOf(saved) >= 0 ? saved : DEFAULT_LANG);

    applyLanguage(startLang, { silent: true });
    bind();
    go(fromHash ? fromHash.slide : 0, { silent: true });
    syncHash();

    body.classList.remove("is-loading");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
