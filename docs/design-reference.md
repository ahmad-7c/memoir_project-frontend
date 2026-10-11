# Design reference — serene-memoir-canvas.lovable.app

Extracted by: fetching the compiled stylesheet (`/assets/styles-Ch07QBo7.css`,
Tailwind v4, OKLCH custom properties) and reading it directly; visiting all
five live pages in a real browser and reading computed styles via
`getComputedStyle`; and reading the four image assets directly. Nothing in
this document is guessed — where I could not extract a real value, it is
marked **APPROXIMATED** or **NOT FOUND**, not silently filled in.

Stack: Vite + React SPA (client-rendered, no SSR content in the raw HTML).
Fonts: Google Fonts `Cormorant Garamond` (ital,wght@400;500;600 / ital
400;500) and `DM Sans` (wght@400;450;500;550;600), loaded via
`fonts.googleapis.com`. **No dark mode** — the stylesheet defines exactly one
`:root` block and no `.dark` block at all.

---

## 1. Colour — every token, OKLCH as shipped + converted hex

```
--background:         oklch(98.5% .005 105)        → #fafaf6
--foreground:          oklch(30%   .025 153)        → #243228
--card:                 oklch(99.8% .002 105)        → #fffefd
--primary:              oklch(39%   .065 153)        → #274f34
--primary-foreground:  oklch(98.5% .005 105)        → #fafaf6   (same as --background)
--secondary:            oklch(94.7% .014 124)        → #ebefe5
--muted-foreground:     oklch(53%   .02  136)        → #676f63
--border:               oklch(87.5% .016 122)        → #d4d8cc
--hero-foreground:      oklch(99%   .004 95)         → #fcfcf9
--paper:                oklch(97%   .012 92)         → #f8f5ec   (defined; no usage found on the 5 pages visited)
--destructive:          oklch(53%   .14  28)         → #ae453b
--hero-shade:           oklch(23%   .03  146 / .7)   → #142114 @ 70%
--veil:                 oklch(24%   .02  150 / .35)  → #19221a @ 35%
--shadow (colour part):oklch(25%   .02  150 / .07)  → #1b241d @ 7%
--hero-scrim:           oklch(20%   .028 146 / .62)  → #0d190e @ 62%
--hero-foot-shade:      oklch(17%   .022 146 / .6)   → #09120a @ 60%
```

No `--accent`, `--ring`, `--input`, `--popover`, `--muted` (non-foreground),
or `--card-foreground` token exists in the shipped CSS — components that
would normally use them (focus rings, inputs) fall back to `--border` /
`--foreground` directly, confirmed by the `/begin` input computed styles
below.

**Role mapping observed in use:**
- Page background: `--background` (#fafaf6, a warm off-white, not pure white)
- Card/input fill: `--card` (#fffefd, marginally lighter/cooler than background)
- Primary text: `--foreground` (#243228, a dark pine-green-black, not pure black)
- Secondary/muted text: `--muted-foreground` (#676f63)
- Hairlines: `--border` (#d4d8cc)
- Primary button fill: `--primary` (#274f34); button text: `--primary-foreground`
- Section-tint backgrounds (final CTA band on `/memoir`): `--secondary` (#ebefe5)
- Text/icons over the hero photo: `--hero-foreground` (#fcfcf9)
- Hero photo gradient overlays: `--hero-shade` / `--hero-scrim` / `--veil` / `--hero-foot-shade`, all low-opacity near-black-green, never pure black
- Error/destructive text: `--destructive` (#ae453b) — **no usage found on any of the 5 pages**; exists in the stylesheet (likely a form-validation state not triggered in this static demo)

**Contrast, measured:**
- `--foreground` on `--background`: ~14.8:1 (AAA)
- `--muted-foreground` on `--background`: ~4.6:1 (AA, body text size)
- `--primary-foreground` (#fafaf6) on `--primary` (#274f34): ~9.2:1 (AAA)
- `--hero-foreground` (#fcfcf9) on the darkest hero overlay stop (~#0d190e at the gradient's strong end): well over 10:1 where text actually sits (bottom-left of the hero, under the heaviest scrim)

---

## 2. Typography

**Families**
```
--font-serif: "Cormorant Garamond", Georgia, serif   — all headings, pull quotes, the brand wordmark
--font-sans:  "DM Sans", sans-serif                   — all UI chrome, body copy, labels, nav
```
No monospace usage found on any visited page.

**Scale in actual use** (Tailwind defaults, not customised — `--text-base:
1rem`, `--text-lg: 1.125rem`, `--text-xl: 1.25rem`, `--text-4xl: 2.25rem`,
`--text-5xl: 3rem`, `--text-7xl: 4.5rem`, with Tailwind's default line-height
ratios: e.g. `--text-base--line-height: calc(1.5 / 1)`). Three arbitrary
one-off sizes also appear: `0.8rem`, `9px`, `23px` (**APPROXIMATED context**
— not traced to specific elements, likely micro badge/icon-adjacent text).

**Custom, hand-authored component classes** (measured via computed style on
the live pages, desktop ≥1500px unless noted):

| Element | Font | Size | Weight | Line-height | Letter-spacing | Colour token |
|---|---|---|---|---|---|---|
| Landing hero `h1` | serif | 82px (desktop) | 400 | 83.64px (≈1.02) | normal | `--hero-foreground` |
| `.eyebrow` (hero) | sans | 10px | 500 | 16px | **2px**, uppercase | `--hero-foreground` / `--muted-foreground` off-photo |
| `.hero-summary` | sans | 13px | 400 | 24.7px (≈1.9) | normal | `--hero-foreground`, opacity .9 |
| `.brand` (wordmark) | serif | 24px | 600 | 36px | normal | `--foreground` |
| `.nav-link` | sans | 12px | 400 | 18px | normal | `--muted-foreground` |
| `/begin` `h1` | serif | 49px | 400 | 56.34px | normal | `--foreground` |
| `/begin` `label` | sans | 11px | — | 16.5px | normal | `--muted-foreground` |
| `.intro h2` | serif | 39px | 400 | 1.2 | normal | `--foreground` |
| `.intro p` | sans | 12px | 400 | 1.9 | normal | `--muted-foreground` |
| `figcaption` | sans | 10px | — | 1.7 | normal | `--muted-foreground` |
| Chapter-one drop cap (first letter of first chapter only) | serif | visibly ~3× body, **exact px NOT FOUND** (likely a `::first-letter` or manual span; no dedicated class matched in CSS search) | — | — | — | `--foreground` |

**Drop cap — important nuance:** only **Chapter One** gets a drop cap, on
both the landing-page sample and the `/memoir` page. Chapters Two–Four do
not. Do not apply a drop cap to every chapter.

---

## 3. Spacing, radii, borders, shadow

```
--spacing: .25rem     (Tailwind's base unit — all padding/gap values are multiples of 4px)
```

**Border radius scale (actual values shipped, not Tailwind defaults for lg/xl):**
```
rounded-sm:   4px
rounded-md:   6px
rounded-lg:   8px
rounded-xl:   8px   (same as lg — not the Tailwind default 12px)
rounded-full: effectively circular (huge px value)
```
Buttons and the invite/action pills use `rounded-full` (pill shape) —
**this reference explicitly uses pill buttons**, unlike this project's prior
theme. Cards, inputs and photo frames use `rounded-md` (6px). Avatars are
circular (`border-radius: 50%` measured directly on the `<img>`).

**Borders:** 1px solid `--border` throughout — hairlines, not heavier
strokes. No border width above 1px found anywhere.

**Shadow:** exactly one shadow token in the whole stylesheet:
```
--shadow: 0 18px 65px oklch(25% .02 150 / .07)
```
A single, very soft, very low-opacity, large-blur drop shadow. **This
reference does use shadow** (unlike this project's immediately prior
Pine-and-brass theme, which banned shadows outright) — but it is one
specific recipe, applied sparingly (large blur, tiny opacity), not a generic
utility used everywhere. Where exactly it's applied was not traced per
element (**APPROXIMATED** — likely cards/popovers; no visible shadow was
obvious on any of the flat page sections I inspected, suggesting it's reserved
for an interactive/elevated state like a dropdown or dialog, not seen in this
static content tour).

**Container / reading-measure widths (Tailwind defaults, confirmed in use):**
```
--container-sm:  24rem (384px)
--container-md:  28rem (448px)
--container-lg:  32rem (512px)
--container-xl:  36rem (576px)
--container-2xl: 42rem (672px)
```
Plus hand-authored page-level max-widths:
```
.site-header      max-width: 1440px
.hero-content      max-width: 1312px  (1440px at ≥1500px viewports)
.memoir-preview    max-width: 1100px  (the landing page's sample-memoir section)
.reader-book       max-width: 1100px  (the /memoir page's chapter content)
```

---

## 4. Custom layout classes (hand-authored, not Tailwind utilities)

These are real CSS class names shipped in the bundle — build equivalents
with the same names/roles, not re-derive them from scratch:

```css
.site-header   { display:flex; justify-content:space-between; align-items:center;
                  max-width:1440px; height:96px; margin:auto; padding:0 64px; }

.hero          { height:565px; min-height:480px; position:relative; overflow:hidden; }
.hero-content  { max-width:1312px; margin:auto; padding:77px 64px; position:relative; z-index:1;
                  color:var(--hero-foreground); }
.hero-image    { position:absolute; inset:0; width:100%; height:100%;
                  object-fit:cover; object-position:50% 48%; }
.hero-foot     { position:absolute; bottom:27px; left:64px; right:64px; z-index:2;
                  display:flex; justify-content:space-between; align-items:center;
                  font-size:10px; color:var(--hero-foreground); }
.hero:after    { content:""; position:absolute; inset:0;
                  background:linear-gradient(90deg,var(--hero-shade),transparent 80%); }
.reader-hero   { height:530px; }   /* the /memoir page's variant of .hero */

.brand         { display:flex; align-items:center; gap:12px; font-family:var(--font-serif);
                  font-size:24px; font-weight:600; color:var(--foreground); text-decoration:none; }
.header-nav    { display:flex; align-items:center; gap:34px; }
.nav-link      { font-size:12px; color:var(--muted-foreground); text-decoration:none;
                  transition:color .2s; }

.eyebrow       { font-size:10px; font-weight:500; line-height:1.6; letter-spacing:2px;
                  text-transform:uppercase; }

.intro         { text-align:center; padding:56px 24px 43px; }
.intro h2      { font-family:var(--font-serif); font-size:39px; font-weight:400;
                  line-height:1.2; margin:12px 0; }
.intro p       { font-size:12px; line-height:1.9; color:var(--muted-foreground); }

.memoir-preview{ max-width:1100px; margin:0 auto; padding:0 40px 66px; }
.book-toolbar  { display:flex; justify-content:space-between; align-items:center;
                  padding:19px 0; font-size:11px;
                  border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
.sample-label  { font-size:9px; color:var(--muted-foreground); }
.chapter-index { display:flex; flex-direction:column; gap:20px; padding-top:3px; font-size:11px; }
.book-grid     { display:grid; grid-template-columns:170px minmax(0,1fr) 270px;
                  gap:38px; padding-top:36px; }
.book-prose h3 { /* chapter heading inside the grid's centre column — size not isolated,
                   visually matches .intro h2 scale, ends in a full stop */ }
.photo-memory  { grid-column:auto; }  /* the right-column photo+quote block */
.reader-book   { max-width:1100px; margin:auto; padding:55px 48px 90px; }
.workspace-columns { display:grid; grid-template-columns:minmax(0,1fr) 230px;
                  gap:65px; margin-top:38px; }  /* /memories and /chapters: feed + sidebar */

.audio-player  { display:flex; align-items:center; gap:12px; margin-top:24px;
                  padding:14px 16px; background:var(--secondary); }

.footer        { display:flex; justify-content:space-between; align-items:center;
                  padding:27px 64px; font-size:10px; color:var(--muted-foreground);
                  border-top:1px solid var(--border); }
```

**Responsive overrides, verbatim from the shipped CSS** (only three custom
breakpoints exist in the whole stylesheet — `≥1500px`, `≤1000px`, `≤700px`):

```css
@media (width>=1500px){ .hero-content{max-width:1440px} .hero{height:610px} }

@media (width<=1000px){
  .site-header{height:84px;padding:0 32px}
  .hero-content{padding:70px 40px}
  .hero-foot{left:40px;right:40px}
  .hero h1{font-size:72px}
  .book-grid{grid-template-columns:130px minmax(0,1fr) 220px;gap:25px}
  .memoir-preview{padding-left:32px;padding-right:32px}
  .workspace-columns{gap:35px}
  .reader-book .book-grid{grid-template-columns:120px minmax(0,1fr)}  /* right column drops */
  .reader-book .photo-memory{grid-column:2}
}

@media (width<=700px){
  .site-header{height:78px;padding:0 22px}
  .brand{gap:8px;font-size:21px}  .brand svg{width:23px}
  .header-nav{gap:14px}  .header-nav .nav-link{display:none}  /* nav text links hide; avatar stays */
  .hero{height:780px}
  .hero-image{display:none}              /* desktop crop hidden */
  .hero-image--phone{display:block; object-position:50% 0%}   /* phone crop shown */
  .reader-hero .hero-image{display:block; object-position:74% 58%}   /* /memoir: desktop crop stays, repositioned */
  .reader-hero .hero-image--phone{display:none}                       /* /memoir never swaps to phone crop */
  .hero:after{ /* gradient direction/stops change per hero type, see below */ }
  .hero-content{padding:69px 26px; padding-top:110px}
  .hero h1{margin-top:16px; font-size:54px}
  .hero-summary{max-width:290px; margin:14px 0 16px; font-size:12px}
  .hero-foot{gap:18px; bottom:21px; left:26px; right:26px}
  .intro{padding:42px 26px 32px}  .intro h2{font-size:32px}  .intro p br{display:none}
  .memoir-preview{padding:0 24px 45px}
  .book-toolbar{gap:12px; font-size:10px}  .book-toolbar .sample-label{display:none}
  .book-grid{grid-template-columns:1fr; gap:25px}   /* stacks to one column */
  .chapter-index{display:none}                       /* chapter nav sidebar hidden on mobile */
  .photo-memory{margin:0}
  .book-prose h3{font-size:34px}
  .photo-memory img{max-height:300px}
  .footer{gap:20px; padding:24px}  .footer .brand{font-size:17px}
}
```

**Critical, easy-to-miss finding: the landing hero ships BOTH image crops in
the DOM at all times** (`.hero-image` = desktop crop, `.hero-image--phone` =
phone crop, both `<img>` elements present), and CSS `display:none` toggles
which one is visible per breakpoint. It is not one image art-directed via
`srcset`/`sizes` — it's two separate elements. **On `/memoir` specifically,
the phone crop is never shown at all** (`.reader-hero .hero-image--phone{
display:none}` persists even under 700px) — only the desktop crop,
repositioned via `object-position`. The mobile hero-image swap is a
landing-page-only behaviour.

---

## 5. Motion

**Exactly one custom entrance keyframe exists:**
```css
@keyframes arrive { 0%{opacity:0; transform:translateY(10px)} 100%{opacity:1; transform:translateY(0)} }
.fade-in { animation: .7s both arrive; }   /* 700ms, default easing (ease), fill-mode both */
```
That's the whole custom motion system — a single fade-up, 700ms, no custom
easing curve specified (browser default `ease`). No stagger values, no
scroll-linked reveal library detected in the stylesheet (**APPROXIMATED**:
the JS bundle may add IntersectionObserver-triggered class toggling that
applies `.fade-in` on scroll — I did not decompile the JS bundle to confirm
this mechanically; the entrance behaviour was visually consistent with
"fades up once on scroll into view" during the browser tour).

**Standard Tailwind transition utilities in use:** `duration-200`,
`duration-300`, `duration-1000`; `ease-in-out` (`cubic-bezier(.4,0,.2,1)`,
Tailwind's unmodified default), `ease-linear`. `.nav-link` specifically:
`transition: color .2s` (no explicit easing → default `ease`).

Shadcn/Tailwind's standard `accordion-down`/`accordion-up`/`caret-blink`/
`enter`/`exit`/`pulse` keyframes are also present (library defaults, not
custom to this product) — relevant only if an accordion or caret-blinking
input is built; not observed in use on any of the 5 pages during this tour.

**No `prefers-reduced-motion` query found in the shipped CSS at all.** The
reference does not handle reduced motion — our build must still honour it
per our own technical requirements; there is nothing to "match" here, just
our own standing rule.

---

## 6. Page-by-page structure, exactly as rendered

### `/` — Landing

Order, confirmed by scrolling the live page top to bottom:

1. **Header** (`.site-header`, sticky-looking but not confirmed sticky):
   leaf-icon + "The Memoir Project." wordmark (links to `/`) · "A glimpse
   inside" (plain text link, scrolls to the sample-memoir anchor) · "Begin"
   button (solid `--primary` fill, pill, 40px tall, links to `/begin`).
2. **Hero** (`.hero`, 565px / 610px≥1500px / 780px≤700px): full-bleed
   `scattered-memories` photo (two crops, swapped by breakpoint — see §4).
   Dark gradient overlay (`.hero:after`) strongest on the left, fading out
   toward the photo's right side on desktop; direction changes to
   top-to-bottom on mobile. Content (`.hero-content`) left-aligned:
   - `.eyebrow`: "EVERY LIFE LEAVES A STORY"
   - `h1`, serif, 82px: "The Memoir Project." — **the final period is
     rendered in italic** (serif italic), the rest of the text upright. This
     is a real, deliberate typographic detail, confirmed by zooming the
     rendered pixels, not a guess.
   - `.hero-summary`, 3 lines: "A life lives on in the people who loved it.
     / Bring their memories together. / Make something you can keep,
     forever."
   - "Begin" button — **a different visual style from the header's Begin**:
     frosted/translucent (bg ≈ white at 10% alpha, border ≈ white at 40%
     alpha, text = `--hero-foreground`), 44px tall, pill.
   - `.hero-foot` (bottom corners, over the photo): left = "A lifetime, kept
     in eight photographs."; right = "A life, remembered together."
     **These two lines are hero-corner captions, not a separate standalone
     section** — correcting a misreading risk in how this could be
     paraphrased; they sit inside the hero, not below it.
3. **Intro section** (`.intro`, centred, plain background): eyebrow "NOT ONE
   STORY. ALL OF THEIRS." · `h2` "A whole life, held in many hearts." ·
   2-line paragraph: "A daughter's story. A friend's photograph. A voice you
   never want to forget. / Together, they become a memoir. Here is a little
   of Edward's."
4. **Sample memoir header** (`.book-toolbar`, hairline border top+bottom):
   book icon + "The life of Edward Williams" + "1948 — 2024" (left) ·
   "An imagined family · sample memoir" (centre, `.sample-label`) · lock icon
   + "A private family book" (right).
5. **Chapter index + Chapter One**, in `.book-grid` (3 columns:
   170px / flexible / 270px):
   - Left: "THE CHAPTERS" eyebrow, numbered list 01–04 (01 active/current):
     "The little things", "A place called home", "By the sea", "What stays
     with us".
   - Centre: "CHAPTER ONE" label, `h3` "The little things." (ends in a
     period), two paragraphs of narrative prose **with a drop cap on the
     first letter of the first paragraph only** — "• Composed with AI · from
     family memories" (bulleted) — "📖 From the family's memories ⌄"
     (expandable; collapsed by default on the landing page) — an audio
     player: play button, waveform, "0:32" duration, a quoted line above the
     player ("He just liked to be outside.") is the clip's own caption, and
     below the player: "Sara's memory · sample voice" (left) / "Transcript
     ⌄" (right, also expandable).
   - Right: a captioned photo ("A summer at the sea, 1978." / "Shared by
     Margaret, his wife.") then an italic serif pull quote ("He made the
     ordinary feel like everything.") with attribution "Sara, his daughter"
     underneath.
6. **CTA**: "Stay a little longer →" (plain text link, not a button) →
   `/memoir`.
7. **Footer** (`.footer`): leaf+"The Memoir Project." (left) ·
   "Made for the stories that stay with us." (right).

No feature grid, no pricing, no testimonials, no logo wall anywhere on this
page — confirmed by scrolling the entire thing. The brief's framing ("the
landing page IS a sample memoir") is accurate to what's shipped.

### `/begin`

Exactly as the brief describes, confirmed:
- `.eyebrow`: "THE BEGINNING"
- `h1` (49px serif): "A place for their story."
- subtext: "Begin a memoir for someone you love."
- `label` "Email" + `input[type=email]` (placeholder "you@example.com")
- `label` "Password" + `input[type=password]` (placeholder "At least 8
  characters")
- Small note: **"This is a design preview. No account will be created."**
  — i.e. the reference's own auth is non-functional/mocked. Useful context:
  do not expect working auth behaviour to reverse-engineer here.
- "← Back" (plain text+icon, no border) ... "Begin →" (solid pill button,
  same style as header)
- "G Continue with Google" — full-width, hairline-bordered button, with a
  small "Preview" tag beside the label (muted, smaller text — signalling
  it's non-functional too).

Inputs: 49px tall, `rounded-md` (6px), 1px `--border`, `--card` background,
14px text, `13px 15px` padding.

### `/memories`

- Top bar (different from the marketing header): leaf+"The Memoir Project."
  · "Your memoir" · "Read the memoir" · a circular initial avatar ("S", no
  photo — just a letter in a tinted circle).
- **Identity strip directly under the top bar — NOT a full-bleed hero.**
  A small circular portrait (measured 74×74px, `border-radius:50%`, the
  `garden-memory` image) sits to the left of: `.eyebrow` "A LIFE, COMING
  TOGETHER" · `h1` "Edward Williams" · subtitle "1948 — 2024 · Family
  memoir". **This is a materially different treatment from `/memoir`'s
  cinematic full-bleed hero — do not build them as the same component.**
- Section tabs: "Memories" (active) · "The chapters" · "Preview memoir".
- Action row: "🔗 Invite family" (plain text+icon link) ... "+ Add a memory"
  (solid pill button).
- Small label: "An imagined family · sample memories".
- **Two-column layout from here down** (`.workspace-columns`: feed
  `minmax(0,1fr)` + 230px sidebar — not a sequential single-column stack):
  - Left (feed): memory cards, newest-first, separated by hairlines. Each
    card: small circular avatar + "Name · relationship" (e.g. "Sara · his
    daughter") · bold serif title ("Sunday mornings in the garden.") · body
    paragraph · optionally a full-width photo (no border-radius observed,
    `beach-memory` at 709×400 measured) · optionally an audio player
    (identical component to the landing page's). **One card legitimately
    mixes text + photo; a separate card (James's) mixes text + audio** — I
    did not find a single card combining all three (text+photo+audio) in
    this sample data, though the brief's modelling rule ("a single memory
    card can carry text, a photograph AND audio together") should still be
    built as a capability, just not something I could visually confirm
    existed in the sample set I scrolled past.
  - Right (sidebar, sticky-looking): "REMEMBERING, TOGETHER" eyebrow ·
    `h3` two lines "No one holds / the whole story." · paragraph · three
    overlapping circular initial avatars ("S", "M", "J") · "Bring your
    family in →". Directly below in the same sidebar (not a separate
    full-width section): "When you're ready, see how these memories fit
    together." / "Arrange their story →" → `/chapters`.
- Footer: identical to landing's.

### `/chapters`

- Same top bar, same compact identity strip (`.eyebrow` "A LIFE, TAKING
  SHAPE" this time), subtitle here is **"The chapters of a life."** (no
  dates — different subtitle format from `/memories`).
- Section tabs, "The chapters" active.
- Action row: "✨ Organise with AI" (ghost/text style, sparkle icon) ...
  "Review & publish →" (solid pill button). **Note: "Compose the narrative"
  is NOT in this top action row** — it appears later, as its own standalone
  button under the chapter list (see below). Two distinct actions in two
  distinct places, not grouped.
- `h2` "A book, not a collection." / subtext "Let each chapter hold a
  different part of their life."
- Chapter list, four rows, each: large serif numeral (01–04) · serif title
  ("The little things") · small contributor line ("Sara & James · family
  memories") · three icon-buttons right-aligned (pencil/edit, up-arrow,
  down-arrow — the first chapter's up-arrow and the last chapter's
  down-arrow are visibly disabled/muted, confirming they're real reordering
  controls with boundary limits, not decorative).
- "📖 Compose the narrative" (hairline-outlined button, book icon) with a
  caption directly beneath, small and muted: **"Their memories remain their
  own. Composed passages are always labelled."** — verbatim, must ship
  exactly as this sentence.
- Footer.

### `/memoir`

- Header: **different from the app top bar** — "← The Memoir Project" (back
  arrow + wordmark, no nav links at all) on the left; "An imagined family ·
  sample memoir" label on the right.
- **Full-bleed cinematic hero** (`.hero.reader-hero`, 530px / 470px at
  ≤1000px — note this is NOT the same height numbers as the landing hero):
  the garden photo, `.eyebrow` "A LIFE, REMEMBERED TOGETHER", `h1` "Edward
  Williams" (same italic-period wordmark treatment does NOT apply here — the
  brief's italic period is specific to the "The Memoir Project." wordmark,
  not every H1), "1948 — 2024" dates line, one-line description "A father. A
  husband. A quietly extraordinary man." `.hero-foot`: "🔒 Shared privately
  with family" (left) / "Collected with love by Sara" (right).
- Chapter nav + Chapter One, **same `.book-grid` 3-column component as the
  landing page's sample section**, now with the Sources control actually
  expanded on interaction:
  - Clicking "From the family's memories ⌄" reveals a tinted panel
    (`--secondary` background) listing **every real source memory verbatim**,
    each with its own "NAME · RELATIONSHIP" micro-label above a quoted
    paragraph — confirmed two sources (Sara's and James's) both appear for
    Chapter One, matching the chapter-list's "Sara & James" contributor
    line from `/chapters`. **Verbatim text matched word-for-word against the
    `/memories` feed** — the Sources panel is not a paraphrase, it's the
    literal original memory text.
  - Below the Sources panel: the same audio player component.
  - Below that, outside the tinted box: a **margin note** — italic serif
    line ("I can still hear that little radio through the kitchen window.")
    with small attribution "A margin note from Margaret" underneath. This is
    the reader-notes/comments layer, rendered inline within the chapter, not
    collected at the end.
  - "💬 Leave a little note" (centred, ghost/text button) closes out the
    chapter before the next one begins.
- Chapters Two and Three follow the same pattern (narrative, "Composed with
  AI · from family memories" label **on each chapter**, Sources control,
  photo, pull quote). **No drop cap on Chapters Two–Four.** Chapter Three's
  full-width photo carries a different caption style from the sidebar
  photos: a small italic line directly beneath it reading "Chapter three ·
  By the sea. Dorset, summer 1978." (location/date, not a "shared by" credit
  — a second, distinct caption format for full-width chapter-break photos
  vs. sidebar card photos).
- **Chapter Four is a different template**, not the 3-column book-grid: a
  centred, standalone block — "CHAPTER FOUR · WHAT STAYS WITH US" (number +
  title inline, dot-separated — not split onto two lines like Chapter One's
  "CHAPTER ONE" + separate heading), a large italic serif pull quote ("Love
  is in the things we remember."), and a small sign-off line directly below:
  "With love, from all of us."
- **Closing CTA**, on a `--secondary`-tinted full-width band (not
  `--background`): `h2` "Everyone has someone to remember." · "Begin a
  memoir for someone you love →" (plain text link, 14px/500, no button
  chrome) → `/begin`.
- Footer: identical to the others.

---

## 7. Images — composition, and a real concern to flag before building

Downloaded to `frontend/docs/reference-images/` (gitignored, study-only,
never to ship):

| File | Composition |
|---|---|
| `scattered-memories-desktop.jpg` | Warm linen fabric, diagonal soft sunlight across the left ~40% (left empty for hero text); eight faded/vintage-bordered photographs scattered and overlapping across the right ~60%, spanning a full life (wedding, newborn feet, three kids at a beach, elderly couple dancing in a garden, graduation, a birthday cake with candles, a girl at a school gate, a man and girl picking apples). A lavender sprig bottom-left, round wire-frame reading glasses top-right. |
| `scattered-memories-phone.jpg` | A **different crop, not a scaled copy**: the top ~55% is plain linen with the same soft light streak and nothing else (text-safe space for the mobile hero), the photos/lavender/glasses are compressed into the bottom ~45%. |
| `garden-memory.jpg` | A man in his 60s–70s, cable-knit jumper, smiling directly at camera, standing in an English garden in front of a stone cottage with an apple-blossom tree. **His face is clearly, directly identifiable** — not a silhouette, not angled away, not distant. |
| `beach-memory.jpg` | A family of four (two adults, two young children) on a pebble beach in front of a sea-arch rock formation (Durdle Door-like Dorset coastline), both adults smiling directly at camera. **Faces clearly identifiable** here too. |

**Flag for the build phase:** both `garden-memory` and `beach-memory` fail
this project's own standing image policy (no identifiable people) and this
brief's explicit caution ("prefer frames where no face is clearly
identifiable, or commission them"). Real equivalents will need to be
sourced as: a garden/cottage/apple-tree scene from behind, at a distance, or
with no person at all; and a beach family scene shot from behind or far
enough that faces aren't resolvable. Flagging now, before sourcing, exactly
as asked.

---

## 8. What I could not extract or had to approximate

- **The exact drop-cap size/markup** (class name, font-size) — no dedicated
  CSS rule matched; it's either inline-styled, a `::first-letter`
  pseudo-element with no isolable class, or JS-computed. Will have to design
  a reasonable equivalent (large serif, 1–2 lines tall) rather than copy an
  exact px value.
- **Exact shadow usage sites** — the single `--shadow` token's token value is
  confirmed, but I did not find or trigger the specific element(s) it
  applies to during the tour (no visible elevation on any static section;
  likely a hover/dialog/dropdown state not exercised).
- **Whether scroll-reveal is IntersectionObserver-driven or purely
  CSS-timeline-driven** — the `.fade-in` class and `arrive` keyframe are
  confirmed; the trigger mechanism (JS toggling the class vs. something
  declarative) was not decompiled from the JS bundle.
- **Three arbitrary one-off font sizes** (`0.8rem`, `9px`, `23px`) found in
  the CSS search were not traced to specific elements.
- **Mobile (375px) and tablet (768px) renders were not screenshotted
  directly** — Chrome's `resize_window` tool did not change the actual
  rendered viewport in this environment (a tooling limitation also hit on
  the previous project phase). The responsive behaviour above is instead
  taken directly from the shipped CSS's `@media` blocks, which is a more
  reliable source than a screenshot would have been anyway (exact values,
  not visual estimation) — but I have not visually confirmed the mobile
  layout renders as the CSS implies. Flagging per the instruction to report
  what I could not extract cleanly.
- **Whether `/memories`' "Invite family" / `/chapters`' "Organise with AI"
  trigger any visible loading or result state** — this is a static
  content demo (confirmed by `/begin`'s own "no account will be created"
  disclaimer); clicking these controls was not attempted, since the brief's
  Step Zero asks for extraction, not interaction testing, and I did not want
  to risk triggering unknown behaviour on a third-party site before being
  asked to.

---

**Stopping here per instruction. Awaiting your check on this extraction
before building tokens, components or pages.**
