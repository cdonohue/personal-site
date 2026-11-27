# chaddonohue.com

A personal site whose hero is a pixel-art desk that runs on real time and real
weather.

```sh
npm install
npm run dev      # localhost:4321
npm run build    # astro check, then a static build to dist/
```

Astro, static output, deployed on Vercel. Four site pages plus the project
explorers under `/projects`, each a real HTML file, so there are no rewrite rules to configure and no client-side routing to get wrong.

## What is where

```
src/components/             theme-neutral components
src/content.ts              everything the site says about jobs, tools and links
src/pages/                  thin route selectors for the active full-site theme
src/themes/pixel-desk/      the complete pixel-desk theme and its workbench
src/themes/flip-board/      a split-flap departures-board theme
themes/pixel-desk/art/      its Aseprite sources and exports (see its README)
src/projects/<name>/        a project's explorer: its own layout, styles, pages
projects/<name>/            a project's source material (e.g. a design system)
public/projects/<name>/     static files a project serves as-is
```

The route files deliberately contain only an import and a render, from
`@site-theme/`, an alias `astro.config.mjs` points at the active theme's pages.
`SITE_THEME=flip-board npm run dev` (or `npm run build`) switches the whole
site; unset, it is the pixel desk. It is an alias rather than a module that
imports both themes because Astro bundles the CSS of everything imported,
rendered or not. A theme can
take over the whole site by supplying its own pages, layout, styles and visual
runtime, then becoming the import selected by `src/pages/`. Shared content and
truly theme-neutral components remain above that boundary.

## The scene

`src/themes/pixel-desk/scene/` knows nothing about React or Astro.
`createDeskRoom(canvas, opts)` takes a canvas and returns something with
`start()`, `stop()` and `set()`. That boundary is what made moving from Next.js
to a Vite SPA to Astro cost almost nothing, and it is worth keeping true.

`src/themes/pixel-desk/components/DeskScene.tsx` is the theme's one React island.
It ships on the home page only; the other site pages send no JavaScript at all.
(Project explorers are their own thing and do; see Projects below.)

What drives it:

- **The weather is real, and it is Houston's.** Open-Meteo supplies the
  conditions without a key or a visitor-location request. Results are cached
  for half an hour; a failed forecast uses the cached or clear fallback.
- **The daylight is real too**, and rides along in the same request. Sunrise and
  sunset drive when the room and the windows go dark. Fixed hours did that job
  once and were only ever right around the equinox: the sun sets at 20:26 here in
  June and 17:25 in December, so any single pair of numbers is over an hour wrong
  for most of the year. Offline it falls back to a fixed curve, which is wrong by
  a bounded amount rather than by half a day.
- **The time is real, and it is the visitor's.** The clock, dusk, activity
  schedule and daily outfit all use the browser's IANA timezone. Houston's
  `America/Chicago` is the fallback if the browser cannot provide one.
- **The schedule is half real.** Weekdays nine to five, the desk is occupied —
  not likely, occupied. Outside that a small weighted curve in `src/activity.ts`
  decides, peaking around a quarter in the evening. So a visitor at eleven on a
  Tuesday always finds somebody, and at eleven on a Sunday usually does not.
- **What is on the screen follows from that.** Somebody there means a real scene,
  weighted towards work inside working hours and towards the game outside them.
  An empty room means a screensaver. The screen is never simply off; the only
  thing that darkens it is the plug leaving the wall.

Everything is decided once per visit. It re-rolled every minute or two once,
which let the chair empty while somebody was mid-sentence — change with no cause
reads as a glitch rather than as life. The one exception is the lamp, which
follows dusk on a timer, because that is a change whose cause is visible in the
windows.

The same roll decides how the desk is found: sitting or standing, with or
without anyone at it, so there are four openings rather than two. That one is
settled rather than played. A page that opens by performing a stand nobody asked
for is an animation happening *at* the visitor, and in an empty room there is
nobody to perform it anyway.

Three things can be worked: the light switch, the desk control on the right edge
of the desktop, and the plug under the left window. The desk is the involved one
— the occupant stands, shoves the chair out of shot and the desktop rises, three
overlapping beats that come to about 800ms. Pulling the plug cuts the monitor,
the clock and the indicator on the power box, and startles whoever is there.

## The flip board

The second theme draws the site as a split-flap board. Every letter is a flap
that runs through the drum to its character, and a page change turns only the
cells whose letter or colour differs: the masthead stays still and only the nav
marker and the body clatter. The clock in the masthead flips just its changed
digits once a minute.

- **The board is a view of real HTML.** Each page renders ordinary semantic
  markup from `content.ts`; elements marked `data-board="text"` or
  `data-board="split"` are read into the board (`board/source.ts`). That markup
  stays in the page for screen readers and is shown as-is without JavaScript.
  Keyboard focus stays on its links and lights the matching flaps.
- **`board/layout.ts` is pure**: blocks and a column count in, a grid of cells
  out. Diffing one grid against the next is the whole effect, so it is tested.
- **One canvas, not an element per flap.** DOM flaps with 3D transforms became a
  compositor layer per turning cell and stalled for over a second on a big page
  change. The canvas redraws only mid-turn cells from pre-rendered sprites.
- **Pages swap without a reload** (`board/router.ts`), so the board survives
  navigation. Each page is still a real static file; the project explorers and
  external links get ordinary navigation.
- It shares the stored light/dark choice with the pixel desk and Unit 01, and
  honours reduced motion by setting letters without turning them.

## The workbench

`npm run dev` also serves **`/dev`**, which is not a page. It holds every scene
value as a control, buttons for the desk and the plug, and an outfit customiser
that previews live and prints a block of TypeScript to paste into
`src/themes/pixel-desk/scene/outfits.ts`. The point is reaching states you would
otherwise wait days for: snow, three in the morning, away-and-standing, the
startle.

**It cannot ship.** `src/themes/pixel-desk/dev/` sits outside `src/pages/`, so
file-based routing cannot find it, and the route is only injected when the
command is `dev`. Both at once on purpose: a build has neither a file to route
nor a route to build, so there is nothing to tree-shake and nothing to take on
trust. `dist/` holds no `/dev` page, and `grep` finds no trace of the panel in
it.

The one concession in shipped code is `setOutfit` on `DeskRoom`, so a colour can
be changed without remounting and losing the desk height mid-fiddle. The site
picks an outfit once from the date and never calls it.

Nothing in the panel persists. Its output is source to paste, which keeps
`outfits.ts` the only place an outfit lives.

The art and the code meet at exactly two places: **slice names** and **tag
names**. `themes/pixel-desk/art/README.md` documents that contract and the
reasoning behind the art itself, including the parts that failed first.

## Design

One accent, two typefaces, one size of body text.

Typography is expressed as roles rather than font names: `--font-display` and
`--font-body` in `src/themes/pixel-desk/styles.css`, and nothing outside that
block names a typeface. Heading *levels* describe the document; `data-role`
attributes describe how things look. The two used to be conflated and it went
wrong in both directions.

Colours come from the scene rather than being invented, so the page and the
illustration read as one thing. Every text colour clears 4.5:1 on its own
background in both schemes.

**The light switch in the scene is the pixel desk's colour-mode control.** The
switch and system appearance write one value in
`src/themes/pixel-desk/theme.ts`, and both the room's lamp and the page's colours
read it. This state belongs inside the visual theme; it does not choose which
full-site theme is active.

A choice beats the system preference and is remembered, so it survives a reload
and the other two pages; changing the appearance again clears it, on the rule
that whichever was done last wins. An inline script in the head applies a stored
choice before anything paints, because the switch lives in the hero island,
which does not exist on the other pages and does not run until after first paint
on this one.

The windows are untouched by any of it. They still run on Houston's sunrise and
sunset, expressed in the visitor's timezone so the scene changes at the correct
instant, while the lamp remains the reader's direct control.

Every anchor goes through `src/components/Link.astro`, which decides for itself
whether it leaves the site and opens a new tab if it does. That is a property of
the component rather than a convention to remember — it was a convention until
now, and had already been missed once.

## Projects

`/projects` lists things built outside the day job, in the site's own design.
Each project then opens into an explorer that is deliberately *not* in that
design: it is the project, shown in its own clothes. The site theme chooses
nothing below `/projects/<name>/`.

### Unit 01

A design system for small personal apps that work like pocket hardware: black,
white and one orange, Libre Franklin and IBM Plex Mono, rules instead of boxes,
square keys with a keycap edge.

- `projects/unit-01/design-system/` is the canonical reference as handed off:
  the brand book, `tokens.json` and the icons. The Overview page reads its
  colours, type, spacing and radii from `tokens.json` at build time.
- `src/projects/unit-01/` is the explorer: Overview, Components and Apps. The
  component styles in `components.css` are taken verbatim from the system's
  shared base, so the Components page shows the real components, all of them
  live — knobs turn with the canonical gesture, the display is a clock.
- `public/projects/unit-01/apps/` holds the 24 apps, each a self-contained
  page exactly as handed off. They fill their window and adapt with container
  queries, so the Apps page links to them rather than framing them. Tuner asks
  for the microphone and Level for the tilt sensor; both need https, which the
  site has.
- Each app is also an installable web app that works offline: its own
  `manifest.webmanifest` and `icons/` (the app's glyph), scoped to its folder
  so the 24 install separately, plus one shared service worker, `apps/sw.js`.
- Every part of every app has a weight — Core, Supporting or Enhancement —
  declared in `catalogue.ts` beside the app's glyph. Core parts are reachable
  at every size: when a layout hides one, a More key opens a sheet holding it
  (`scripts/unit01-weights.js`, copied to `apps/`). This is rule 8 of the
  system; the brand book explains how to choose a weight.
- `npm run unit01:apps` generates all of the above (add `-- --icons` to redraw
  the icons, which needs Playwright). It writes the head tags between
  `unit01-app` markers, so the apps are otherwise untouched and a re-run is a
  no-op; re-run it after editing an app, its weights or the runtime, so the
  service worker's version changes and installed copies update.
- `npm run unit01:audit` checks the rule against a running preview: every
  Core part reachable at every handoff size, every weight still matching
  something, no overflow, no page errors. It exits non-zero on failure.

The explorer is fluid in tiers: below 720px a menu key opens its sections,
from 720px they sit in the title bar, and from 1100px they become a left
column. Its Dark switch stores the same choice as the pixel desk's light
switch, so Night in one is Night in the other.
