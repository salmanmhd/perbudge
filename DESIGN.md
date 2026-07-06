---
name: Kharcha
description: An AI-powered personal finance tracker for Indian families — calm, high-clarity product UI with an emerald accent, monospaced money, and full light/dark theming.
colors:
  primary: "oklch(0.508 0.118 165.612)"
  primary-foreground: "oklch(0.979 0.021 166.113)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  secondary: "oklch(0.967 0.001 286.375)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  sidebar: "oklch(0.985 0 0)"
  chart-1: "oklch(0.845 0.143 164.978)"
  chart-2: "oklch(0.696 0.17 162.48)"
  chart-3: "oklch(0.596 0.145 163.225)"
  chart-4: "oklch(0.508 0.118 165.612)"
  chart-5: "oklch(0.432 0.095 166.913)"
typography:
  display:
    fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, monospace"
    fontSize: "1rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
rounded:
  base: "0.45rem"
  sm: "0.27rem"
  md: "0.36rem"
  lg: "0.45rem"
  xl: "0.63rem"
  2xl: "0.81rem"
  3xl: "0.99rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 0.5rem"
    height: "1.75rem"
  card-surface:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.3xl}"
    padding: "1rem"
---

# Design System: Kharcha

## 1. Overview

**Creative North Star: "Quiet confidence for everyday money decisions."**

Kharcha uses a calm, high-clarity visual language that feels practical rather than ornamental. Clean surfaces, one intentional accent, and clear structure let the product support fast financial tasks without visual noise. It reads trustworthy and modern, never cold or clever for its own sake.

The system is built on **shadcn/ui + Tailwind v4** with OKLCH tokens, and ships **full light and dark themes** (via `next-themes`). Two typefaces do the work: **Inter** for everything textual, **JetBrains Mono** for money and figures.

**Key Characteristics:**

- Mobile-first, task-driven layouts with generous breathing room
- One emerald accent for action and meaning; a separate multi-hue palette for data
- Inter for reading and UI; monospaced numerals so money lines up and reads as data
- Soft elevation through tonal layering and gentle rounding, not heavy shadow
- Light/dark parity — every token has a dark counterpart

## 2. Colors

Restrained and practical: one meaningful accent for actions and state, near-white surfaces and dark ink for readability in light mode, and a near-black stack in dark mode. A distinct multi-hue palette exists **only for data** (categories and charts) — that is data encoding, not decoration, and does not violate the one-accent rule.

### Primary

- **Emerald** (`oklch(0.508 0.118 165.612)`): Primary actions, active/selected states, brand moments. In dark mode the primary deepens to `oklch(0.432 0.095 166.913)`.
- **Primary Foreground** (`oklch(0.979 0.021 166.113)`): Text/icons on emerald.

### Neutral

- **Paper / Card** (`oklch(1 0 0)` light · `oklch(0.205 0 0)` card in dark): App shell and card surfaces.
- **Ink** (`oklch(0.145 0 0)` light · `oklch(0.985 0 0)` dark): Primary text, high-contrast headings.
- **Secondary** (`oklch(0.967 0.001 286.375)`): Faintly cool neutral for secondary buttons/surfaces.
- **Muted** (`oklch(0.97 0 0)`) / **Muted Text** (`oklch(0.556 0 0)`): Supporting panels; secondary and helper copy.
- **Border** (`oklch(0.922 0 0)` light · `oklch(1 0 0 / 10%)` dark): Dividers, form outlines. Often used at reduced opacity (`border/60`, `border/70`).
- **Ring** (`oklch(0.708 0 0)`): Focus rings.

### Sidebar layer

A dedicated surface set (`--sidebar*`) keeps the dashboard chrome one step apart from content: `oklch(0.985 0 0)` in light, `oklch(0.205 0 0)` in dark, with its own primary/accent/border tokens.

### Semantic

- **Destructive** (`oklch(0.577 0.245 27.325)`): Errors, removals, and — by convention — expense figures.
- Income reads **emerald**, expense reads **destructive/red**, net balance reads **blue** (`text-blue-500`). Meaning is always paired with an icon and label, never carried by color alone.

### Chart & category palette (data only)

- **Chart ramp** (`--chart-1` → `--chart-5`): a five-step emerald ramp (`oklch(0.845 … )` → `oklch(0.432 … )`) for series and trends.
- **Category palette** (`lib/categories.ts`): ten fixed categories, each with an emoji and its own OKLCH hue (food orange, transport blue, rent violet, bills cyan, entertainment magenta, shopping red, health green, education indigo, salary green, others slate). Used in the donut and category breakdown.

### Named Rules

**The One Accent Rule.** Emerald is for meaningful action and state only, never decorative wallpaper. **The Data-Palette Exception.** Multi-hue color is legitimate when it *encodes* data (categories, chart series); it must not leak into UI chrome.

## 3. Typography

**Sans (UI + body):** Inter — `var(--font-sans)`
**Mono (money + figures):** JetBrains Mono — `var(--font-mono)`

Inter carries headings, labels, buttons, and prose. Money and key numerals render in **JetBrains Mono, bold, tracked slightly tight** so figures align and read unmistakably as data (see `summary-cards`). This is the system's one strong typographic signature; use it deliberately, not everywhere.

Because this is a **product** register, the app UI uses a **fixed rem scale** (headings from `text-lg` to `text-3xl`), not fluid clamp. Fluid clamp headings appear **only** on the marketing landing page, where display type up to `text-6xl` is appropriate.

### Hierarchy

- **Display / Hero** (600, up to ~`clamp(2.25rem, 4.5vw, 3.75rem)`, 1.05, `-0.03em`): Landing hero only.
- **Page Title** (700, `text-2xl`–`text-3xl`, tight tracking): Dashboard page headings.
- **Card / Section Title** (600, `text-lg`): Card and panel titles.
- **Body** (400, `1rem`, 1.6): Prose and explanatory copy, ~65–75ch.
- **Money / Figures** (700, mono, `text-xl`–`text-2xl`): Balances, totals, transaction amounts.
- **Label** (500–600, `text-xs`, uppercase + `tracking-wider` for metadata): Controls, stat captions.

### Named Rules

**The Readability Rule.** Information should be obvious at a glance, especially money. **The Mono-Money Rule.** Currency and standout figures use the mono face; running text never does.

## 4. Elevation

Depth comes from tonal layering and soft rounding more than shadow. Cards sit on near-white/near-black surfaces with light borders; when separation is needed, a soft diffuse shadow is used.

### Shadow Vocabulary

- **Ambient Low** — `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` (light) / `0.1` alpha (dark): elevated cards, drawers.
- **Ambient Marketing** — larger, softer shadows (`0_24px_80px …`) reserved for the landing page.
- **`.translucent-surface`** utility — `bg-background/90` + `backdrop-blur-xl` + soft border + ambient shadow + `rounded-3xl`. Used on dashboard summary/insight cards for a light frosted feel. **See Tensions §7.**

## 5. Components

### Buttons

- **Scale is compact and dense** (Raycast-like): default height `1.75rem` (`h-7`), `text-xs`, `rounded-md`, with a full size ladder (`xs`, `sm`, `lg`, `icon*`). This is the app-shell button vocabulary.
- **Variants:** `default` (emerald fill), `outline`, `secondary`, `ghost`, `destructive` (tinted `destructive/10`, not solid), `link`.
- **States:** `hover` (lightened fill), `focus-visible` (ring `ring/30` + border), `active` (1px nudge down), `disabled` (50% opacity), `aria-invalid` (destructive ring). All wired via `data-slot` / `data-variant` / `data-size`.
- **Landing exception:** hero CTAs use large `rounded-full` pills — a marketing treatment, not the app scale.

### Cards / Containers

- **Corner style:** generously rounded (`rounded-3xl` on surfaces; base radius `0.45rem` scales up via the computed `--radius-*` ladder).
- **Background:** near-white/near-black surfaces separated from the page by border and tone; many use `translucent-surface`.
- **Padding:** compact on mobile (`p-3.5`) stepping up on desktop (`p-5`).

### Inputs / Fields

- Light surfaces, visible borders, clear labels; strong border/ring emphasis on focus, no decorative glow. Semantic destructive styling for errors. Built on shadcn `input` / `label`, with `react-hook-form` + `zod` validation.

### Data display

- **Recharts** for spending-over-time and the category donut, themed to the chart ramp + category palette.
- **Table** (shadcn) for the transaction list, with filters.
- **Drawer** (`vaul`) for quick-add; **Dialog** (radix) for transaction input modal; **Skeleton** for loading, not spinners.

### Navigation

- Dashboard shell = sidebar (own color layer) + top structure, with clear current-selection emphasis. Landing = sticky translucent top bar.

## 6. Do's and Don'ts

### Do

- **Do** use emerald for important actions and selected states only.
- **Do** render money and standout figures in mono; keep running text in Inter.
- **Do** keep body text dark/legible; pair color meaning with icon + label.
- **Do** use the category/chart palette for data encoding, and design every surface for both light and dark.
- **Do** keep the app's compact button scale consistent screen to screen.

### Don't

- **Don't** turn the UI into a flashy fintech or AI demo — no neon, no overbuilt motion.
- **Don't** let multi-hue category color leak into UI chrome.
- **Don't** use dense, spreadsheet-like layouts where a calmer, guided flow serves better.
- **Don't** rely on color alone for meaning, state, or hierarchy.
- **Don't** carry the landing page's `rounded-full` pills or fluid clamp headings into the app shell.

## 7. Tensions to resolve

Documented divergences between built code and stated intent — decisions to make deliberately, not drift into.

- **Glass vs. anti-reference.** PRODUCT.md lists "glassmorphism-heavy visuals" as an anti-reference, yet `.translucent-surface` (backdrop-blur cards) is used across the dashboard. Today's usage is restrained (`bg-background/90`, subtle). **Decide:** keep it as a light, occasional frost, or replace with solid tonal cards to fully honor the anti-reference. Don't let blur spread to every surface.
- **Two button languages.** The app uses a dense `h-7`/`text-xs`/`rounded-md` scale; the landing uses large `rounded-full` pills. This is a reasonable marketing-vs-product split, but it must stay a clean boundary — neither vocabulary should bleed across.
- **Insights placeholders.** The insights page ships live AI digest plus two "Coming in next update" placeholder cards (Monthly Comparison, Spending Anomalies). Fine as a roadmap signal; revisit their empty-state treatment so they read as intentional, not unfinished.
- **Family / EMI / goals not yet modeled.** Copy and principles reference shared/family finance, EMIs, and savings goals, but the data model is single-user. Design for these without implying they already exist.
