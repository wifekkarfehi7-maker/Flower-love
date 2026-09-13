# MenuQR — présentation commerciale / العرض التجاري

A bilingual (Arabic RTL + French) sales deck for the MenuQR digital-menu
platform, built to be shown directly to a restaurant or café owner in Tunisia.

Twelve slides, one HTML file, no build step and no network: the fonts, the
icons, the phone and dashboard mockups and the QR codes are all part of the
folder. It opens by double-clicking `index.html`.

---

## Running it

**The quickest way** — double-click `index.html`, or:

```bash
open  menuqr/presentation/index.html     # macOS
xdg-open menuqr/presentation/index.html  # Linux
start menuqr\presentation\index.html     # Windows
```

**From a local server** (handy for showing it on a phone over the same wifi):

```bash
cd menuqr/presentation
python3 -m http.server 8080      # then http://localhost:8080
# or: npx serve .
```

**To put it online**, upload the whole `presentation/` folder to any static host
(Netlify, Vercel, GitHub Pages, or the `public/` folder of the MenuQR app). It
is plain static files — nothing to configure.

---

## Presenting

| | |
| --- | --- |
| Next slide | `→` (`←` in Arabic), `Space`, `↓`, `Page ↓`, swipe |
| Previous slide | `←` (`→` in Arabic), `↑`, `Page ↑`, swipe |
| First / last slide | `Home` / `End` |
| All twelve slides at a glance | `O`, or click the slide counter |
| Full screen | `F`, or the button top-right |
| Leave full screen / close the overview | `Esc` |
| Switch language | `A` for العربية, `L` for Français, or the switcher top-right |

The language switcher (**العربية | Français**) changes the entire deck — copy,
reading direction, typography and the demo menu inside the phone. The choice is
remembered for the next time the deck is opened.

Every slide has its own address, so you can open the deck straight on the slide
you need — `index.html#/ar/4` opens slide 4 in Arabic, `#/fr/11` opens the
contact slide in French. Handy for sending someone a single slide by link.

It works full-screen on a laptop, on a tablet, and on a phone (the six-step
diagram becomes a vertical flow, the dashboard drops its secondary columns).

---

## Exporting to PDF

The deck prints as a proper 16:9 slide deck — one slide per page, twelve pages.

1. Open `index.html` in **Chrome** or **Edge**, and pick the language you want
   to export. Each language is its own PDF; run the export twice for both.
2. `Ctrl/Cmd + P`.
3. Set **Destination** to *Save as PDF*.
4. Set **Layout** to *Landscape*, **Margins** to *None*.
5. Open *More settings* and tick **Background graphics** — without it the dark
   slides print white.
6. Save.

The page size is fixed at 297 × 167 mm (16:9) by the stylesheet, so the result
is identical whatever screen you print it from. Animations, the navigation bar
and the language switcher are left out of the print automatically.

---

## Making it yours

Everything you would want to change is at the top of **`content.js`**.

```js
var BRAND = {
  name: "MenuQR",
  whatsapp: "21694409166",          // international format, no "+"
  whatsappDisplay: "+216 94 409 166",
  logo: "",                          // e.g. "assets/logo.svg"
  website: "",                       // e.g. "https://menuqr.tn"
  instagram: "",
  facebook: ""
};
```

- **Logo** — drop your file in this folder and set `logo: "my-logo.svg"`. It
  replaces the mark on the closing slide.
- **Website, Instagram, Facebook** — fill any of them in and it appears as a
  link on the closing slide. Left empty, nothing is shown: the deck never
  displays an address that does not exist.
- **WhatsApp** — change both `whatsapp` and `whatsappDisplay`. Every WhatsApp
  button and the printed number follow. The QR codes drawn on slides 1, 3, 10,
  11 and 12 are **real, scannable codes** pointing at `wa.me/21694409166` — if
  you change the number, regenerate them (see below).
- **The sales copy** — the two language dictionaries further down `content.js`
  (`CONTENT.ar` and `CONTENT.fr`), one block per slide, written independently
  rather than translated word-for-word.
- **The demo menu inside the phone** — the `MENU` object: real Tunisian dishes
  and TND prices, the same catalogue the platform ships as a demo venue.

### Regenerating the QR codes

The codes are inline SVG in `index.html` (the `<symbol id="qr">`). To point them
somewhere else:

```bash
npx qrcode -t svg -e Q -o qr.svg "https://wa.me/YOUR_NUMBER"
```

then copy the `d="…"` of the generated path into that `<symbol>`, and set its
`viewBox` to match (a longer URL produces a bigger grid than `0 0 25 25`).

---

## What is in the folder

```
index.html    the twelve slides, the icon sprite and the QR symbol
styles.css    design system, slide layouts, responsive rules, print/PDF rules
content.js    BRAND settings, the demo menu, and the Arabic + French copy
app.js        navigation, language switching, the mockup animations
fonts.css     Cairo (Arabic) and Inter (Latin), self-hosted
fonts/        the three font files — 156 KB, so the deck needs no network
```

Fonts are Cairo and Inter, both under the SIL Open Font License 1.1.

---

## The twelve slides

| # | Slide | Purpose |
| --- | --- | --- |
| 1 | Hero | What this is, in one sentence |
| 2 | The problem | What the printed carte actually costs |
| 3 | The solution | QR → phone → menu |
| 4 | How it works | The six-step diagram |
| 5 | Côté client | What the guest sees on their phone |
| 6 | Tableau de bord | What the owner controls |
| 7 | Benefits | Six reasons, one line each |
| 8 | Comparison | Printed carte vs QR menu |
| 9 | Use case | Changing one price, both ways |
| 10 | Image | The menu as part of the brand |
| 11 | Call to action | WhatsApp, prominently |
| 12 | Closing | Name, line, contact |
