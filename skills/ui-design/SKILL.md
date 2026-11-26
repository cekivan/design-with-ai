---
name: ui-design
description: Designs web app screens in React that look intentional instead of AI-generic, using a calm, data-first base style with dark and light themes. Use whenever you are asked to design, build, restyle or critique a screen, web app, dashboard, landing page or component.
version: 0.4.1
owner: "@Team1-Turkiye"
tags: [ui, ux, design, react, workshop]
---

# UI Design

You are designing for real people, not for a screenshot. Left alone, you produce the statistical average of every interface you have seen, and the average looks generic: purple gradients, emoji, big centered heroes. This skill replaces that default with a base style and with decisions.

Follow the steps in order. Do not skip the brief, and do not skip looking at the result.

## When to use

- Designing or building a new screen, flow, web app, dashboard or component.
- Restyling or improving an existing design.
- Critiquing a design (run only steps 6 and 7).

Do not use it for pure backend work or for copy that has no interface.

## Files

| File | What it holds |
| --- | --- |
| `theme.css` | The tokens and five dials (theme, neutral, accent, shape, density) for dark and light, every combination contrast-checked. Start from it. |
| `patterns.md` | Recipes for the shell, layouts, filters, stat tiles, tables, selected rows, chips, buttons, forms. |
| `DESIGN.md` (repo root) | The team's decisions: persona, tone, theme, accent, and changes to the base. |
| The brief | What the product is for. In the workshop, `DESIGN.md` names one of the five files in `brief/`. |

If `DESIGN.md` is missing, or its **Brief**, **Persona** or **Ton** sections still say `TODO`, stop and ask the user to fill them in. Never invent a persona on their behalf. Visual fields left open (`AI seçsin`) are yours to decide in step 2, with a reason.

## Base style

The base style is calm and data-first. It looks like a precise instrument, not a poster. Hold on to these seven ideas; they are what make it look designed.

1. **Monochrome first.** Grays carry almost everything. There is one accent hue, and it only marks what is live, selected, current or the latest data point, in small marks: a data bar, a status dot, a chip, a focus ring. The accent never fills a row, a panel or a card, and never runs along their sides. If you take the accent away, the screen still works.
2. **A full-screen product, not a card.** The app fills the browser window: a full-width top bar, an optional sidebar, and a main area that uses the width. Never put the whole app in one centered, rounded card on an empty background; that reads as a screenshot, not a platform.
3. **Layered surfaces, not shadows.** Canvas → panel → inset. Depth comes from a one-step change in surface and a 1 px hairline, never from drop shadows or glows. Every line is solid and the same color along its whole length: it never fades, tapers or glows. Backgrounds are flat colors with no texture.
4. **Quiet type, loud numbers.** One family (from the list in step 2). Labels are regular weight and muted. Values are medium weight, larger, in tabular figures, with the unit smaller and muted beside them (`1.82` `s`). Nothing is bold except what must be read first.
5. **Rows, not cards.** Collections are dense tables or lists with hairline dividers and a whole-row click target. Cards are for summaries (stat tiles), not for every item.
6. **Small, honest visuals.** Inline bar strips, meters with a target marker, a dashed threshold line, a hatched bar for a failed or timed-out value. No decorative illustration or stock imagery.
7. **Pills and one primary.** Buttons, chips and segmented controls are pill-shaped. Every screen has one filled primary button; every other action is a ghost button.

**The base style is a grammar, not a template.** Two products built with this skill should feel related, not identical: the dials, the font and the layout change from product to product (step 2).

Both themes use the same token names. Dark: near-black canvas and bars, inset tiles darker than the panel. Light: white bars and panels on a warm off-white canvas, inset tiles a shade darker than white. Never use pure `#000000`.

## Steps

### 1. Restate the brief

Before writing any code, write three short lines:

- **Who** uses this (from the persona in `DESIGN.md`) and in what situation.
- **The one job** each screen must do.
- **The one action** the user should take on each screen.

Expected result: three lines the user could disagree with. If they are vague, the design will be too.

### 2. Set the dials

Choose one value for each dial and write it down with a one-line reason drawn from the persona, the tone or the domain:

| Dial | Options | Ask yourself |
| --- | --- | --- |
| Neutral | `neutral` · `warm` · `cool` | Hospitality, food, people → often warm. Finance, dev tools, health → often cool. |
| Accent | `blue` · `green` · `amber` · `coral` · `teal` · `mono` | What does "live / done / now" mean in this domain? Avoid a hue that clashes with `--danger` if errors are frequent. |
| Shape | `sharp` · `soft` · `round` | Precise and professional → sharp. Friendly, consumer → round. |
| Density | `compact` · `comfortable` | How many items does the user scan at once? Under time pressure, at arm's length → comfortable. |
| Font | Geist · IBM Plex Sans · Manrope · Instrument Sans · Figtree · Schibsted Grotesk | Match the tone words in `DESIGN.md`. |
| Layout | see **Layouts** in `patterns.md` | What is the one main job of the screen? |

`DESIGN.md` wins: if the team set a dial, use it. If a dial is left open, decide it yourself; do not fall back to the same combination every time. Never pick a value outside these lists without recomputing the contrast ratios.

Then copy `theme.css` into the output's stylesheet, change the font `@import` and `--font`, and set the dials as `data-*` attributes on `<html>` (see **Dials and theme toggle** in `patterns.md`). After this step, no raw hex value, font name or pixel size appears outside the token block.

### 3. Lay out the hierarchy before the decoration

For each screen, decide the reading order (1st, 2nd, 3rd thing the eye hits) and build it with size, weight, position and space alone. Use the layout you chose in step 2 and the patterns from `patterns.md` that fit the content. Add the accent last.

### 4. Build

Build a React app (function components, `useState` for navigation and form state). Unless the user says otherwise:

- Output two files: `App.jsx` (default export `App`) and `styles.css`, imported by `App.jsx`.
- No UI libraries, CSS frameworks or icon packages. Inline SVG icons only.
- A theme toggle in the top bar switches `data-theme` between `dark` and `light`.
- The layout is built for a 1440 × 900 laptop screen and still works at 1024 px wide.

Follow **Principles**, avoid every **Anti-pattern**, and use realistic content in the product's language: real-sounding names, dates, places and numbers. Never use lorem ipsum, "Event Title" or "John Doe".

### 5. Fill in the states

Each screen needs its hover, focus, selected, disabled, empty and error states. Forms need a success state. Without them it is a picture, not an interface.

### 6. Look and self-critique

Look at the rendered result in **both themes**. If you can run the app or take a screenshot, do it. Check every screen for text that overlaps, gets clipped, overflows its container or runs into its label. If you cannot render it, say so in the report; do not claim visual checks you did not do.

Then score the result against **Verification**. For every item that fails, write one line: what is wrong, where, and the concrete fix (e.g. "Register button in light theme: 3.1:1, use `--btn` instead of the accent").

### 7. Fix and report

Apply the fixes. Then report to the user in this order:

1. The three brief lines from step 1.
2. The dials, font and layout you chose, each with its reason, and any other decisions that were not in `DESIGN.md`.
3. The checklist result, before and after.

## Principles

### Hierarchy

- Each screen has exactly one most important element. If everything is bold, nothing is.
- Build importance with size, weight and space first, color last.
- Secondary information (dates, meta, labels) is smaller and muted, not just smaller.

### Color

- 60 / 30 / 10: surfaces, neutral text and lines, accent. In the base style the accent is closer to 5%, and it is never a large fill: a selected row or panel changes surface (`--hover`), not color.
- One accent hue. A second hue needs a job (for example `--danger` for errors).
- Color is never the only signal: a status also has a word or an icon.

### Contrast

- Body text: at least **4.5:1** against its background, in both themes.
- Large text (24px+, or 18.5px+ bold), icons and input borders: at least **3:1**.
- Placeholder and disabled text still need to be readable; muted is not invisible.
- The ratios are written next to each token in `theme.css`. If you change a token, recompute.

### Typography

- One family from the font list; a second only if `DESIGN.md` asks for it. A monospace only for code or IDs.
- The five sizes in `theme.css`, reused everywhere. Emphasize with weight (400 / 500), not with a new size.
- Line height 1.4 to 1.5 for text, 1.1 to 1.2 for the page title.
- Tabular figures for every number that sits in a column or changes.

### Spacing and layout

- Every spacing value comes from the 4 px scale.
- Proximity: space inside a group is smaller than space between groups.
- Align to a small number of edges. Left-align text; right-align numbers.
- The app uses the full window. Cap the width only of reading text and forms (about 720 px); let tables, boards and panes grow with grid columns.

### Interaction

- Click targets at least **32 px** high; the primary action **44 px**.
- Every interactive element has visible hover, focus (`:focus-visible` ring), pressed and disabled states.
- Forms: visible labels above fields, the error next to the field in words, the primary button at the end of the flow.
- Motion is short (120 to 200 ms) and only explains a change. Respect `prefers-reduced-motion`.

## Anti-patterns

These are the signatures of an AI-generated interface. Do not use them unless `DESIGN.md` asks for them by name.

- Purple-to-blue (or any rainbow) gradients on backgrounds, buttons or text.
- Emoji used as icons.
- A generic hero: big gradient headline, vague subtitle, two buttons.
- The whole app inside one centered, rounded card with empty background around it.
- Every item in its own card; cards inside cards.
- Glassmorphism, glows, drop shadows on everything.
- Colored side stripes: a thick or colored `border-left` (or a `::before` bar) on cards, rows, list items, alerts or quotes.
- Borders or dividers that fade out (gradient borders, `mask-image` fades, a line that disappears toward one end or corner).
- Textured backgrounds: dot grids, line grids, noise or grain overlays, radial spotlights behind content.
- Every section centered, every card the same size.
- Avatar circles with initials used as decoration.
- Invented vanity stats and testimonials ("10K+ happy users").
- Bold on everything; three accent colors on one screen.
- A different border radius on every component.

## Verification

The design is done when every line is true. Write ✅ or ❌ next to each in your report.

- [ ] The app fills the window (full-width top bar, main area uses the width); it is not one floating card.
- [ ] Each screen has one clear most-important element and one primary action.
- [ ] All colors, fonts and spacings come from tokens.
- [ ] Body text ≥ 4.5:1, large text, icons and input borders ≥ 3:1, in **both** themes.
- [ ] One type family (unless `DESIGN.md` says two); five sizes or fewer; numbers in tabular figures.
- [ ] Spacing follows the 4 px scale; related items are grouped by proximity.
- [ ] The accent appears only as small marks (data bar, status dot, chip, focus ring) on live, selected or current things; it fills no row, panel or card.
- [ ] No card, row, panel or callout has a colored stripe on one side; borders are the same neutral line on every side.
- [ ] The dials, font and layout are stated with a reason in the report.
- [ ] Click targets ≥ 32 px, the primary ≥ 44 px; hover, focus, disabled states are visible.
- [ ] Empty, error and success states exist.
- [ ] Form fields have visible labels and error messages.
- [ ] The rendered screens were looked at in both themes: no overlapping, clipped or colliding text.
- [ ] Every border and divider is a solid 1 px line in one token color; every background is a flat token color.
- [ ] No item from **Anti-patterns** is present.
- [ ] Content is realistic and in the product's language.
- [ ] Every rule in **Team learnings** below is followed.

## Common failures

| Symptom | Fix |
| --- | --- |
| "Looks like every other AI app." | Remove gradients, emoji and shadows first; then reduce the accent to one job. |
| Looks like a widget or a screenshot, not a platform. | Remove the outer card and its margin; make the top bar full width and let the main area fill the window. |
| Feels "AI-made" even without gradients. | Look for fading borders, dot or grid backgrounds, glows and noise; replace them with flat surfaces and solid `--line` borders. |
| Looks flat and unfinished. | Add the layer step (panel → inset), hairlines, tabular numbers and one small visual per tile. |
| Everything feels equally important. | Pick the one element per screen; shrink and mute the rest. |
| Crowded, hard to scan. | Increase the space between groups, not inside them. |
| Accent color is everywhere. | Accent only as small marks: the latest data point, a status dot, focus. Selected rows use `--hover`. The primary button uses `--btn`. |
| A big blue (or any accent) block on the selected row. | Replace the tint and outline with `--hover`; put the expanded detail on `--inset`. |
| A colored stripe on the left of a card, row or alert. | Remove it. Show state with a word, an icon or a status dot inside the content, and keep the border neutral on every side. |
| "Looks the same as last time." | Revisit step 2: change the dials and the layout to fit this product's persona and job. |
| Light theme looks washed out. | Muted text is `--text-2` / `--text-3`, never lighter; lines are `--line`, not lighter. |
| Label and value run together (e.g. "DüzenleyenYazılım"). | Put the label above the value, or give the label column a fixed width and a 16 px gap. |

## Team learnings

<!--
WORKSHOP ROUND 3: Add what YOUR team learned here.
Each rule you add is a rule the agent follows next time.
Write it as: Rule / Why / Example. Turkish is fine.

Example:
- **Kural:** Etkinlik listesinde tarih ilk sütun olsun.
  **Neden:** Öğrenci önce "ne zaman" diye bakıyor, sonra "ne".
  **Örnek:** `Per 3 Ara · 13:30` ilk sütunda, etkinlik adı ikinci sütunda.
-->

- **Kural:** Göz konforu öncelikli ekranlarda 5'li tipografi ölçeğini bir kademe büyüt (`--size-1: 14px`, `--size-2: 16px`, `--size-3: 19px`, `--size-4: 28px`, `--size-5: 34px`); takvim bloklarında ve satırlarda ana başlık `16px medium (--text)`, saat ve yer gibi kritik ikincil bilgiler `14px (--text-2)` olsun (soluk `--text-3` kullanma).
  **Neden:** Bilgisayarda uzun kullanımda `13px` ve aşırı soluk metinler göz yoruyor; blok içi okuma hiyerarşisini büyütüp netleştirmek tarama hızını ve göz konforunu doğrudan artırıyor.
  **Örnek:** Takvim bloğunda üstte `Termodinamik II` (`16px`, `500`, `--text`), altta `MAK301 · 09:00–10:50 · M5 Amfi 2` (`14px`, `--text-2`, `tabular-nums`).

- **Kural:** Ekranın tek dolu ana aksiyon butonu (`≥ 48px`) her zaman ilk bakışta, sayfa başlığının sağ üstünde (scroll etmeden görünür) yer alsın; haftalık programda tek tıkla açılan **Düzenleme Modu** ile ders/etkinlik eklenip çıkarılabilsin, bloklar sürüklenerek günü ve saati ayarlanabilsin (üst/alt kenardan uzatma/kısaltma + `Geri al / Ctrl+Z`); tüm formlarda (teslim, ders/etkinlik ve not) her alanın üstünde görünür etiket + `Zorunlu` / `İsteğe bağlı` bilgisi, altında kısa yardımcı metin ve anlık alan içi doğrulama hatası bulunsun.
  **Neden:** Kullanıcı çakışma gördüğünde bloğu sürükleyip anında çözebilmeli, ana aksiyonu 2 saniyede görebilmeli ve hangi alanın zorunlu olduğunu tahmin etmeden hatasız kayıt oluşturabilmeli.
  **Örnek:** `Bu Hafta` başlığının sağında `+ Yeni teslim ekle` (`primary`, `48px`); `Haftalık Program` başlığında `Programı düzenle` + `+ Ders ekle` (`ghost`), düzenleme modunda sürükle-bırak taşıma (5 dk snap), kenar tutamacı, silme ve `Geri al`; modal formlarda `Başlık · Zorunlu` etiketi ve bitiş < başlangıç için alan altı hata metni.
