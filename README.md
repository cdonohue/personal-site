# chaddonohue.com

A personal site whose hero is a pixel-art desk that runs on real time and real
weather.

```sh
npm install
npm run dev      # localhost:4321
npm run build    # astro check, then a static build to dist/
```

Astro, static output, deployed on Vercel. Three pages, each a real HTML file, so
there are no rewrite rules to configure and no client-side routing to get wrong.

## What is where

```
src/components/             theme-neutral components
src/content.ts              everything the site says about jobs, tools and links
src/pages/                  thin route selectors for the active full-site theme
src/themes/unit-01/         the active theme: Unit 01 layout, styles and pages
src/themes/pixel-desk/      the pixel scene, its workbench, and the earlier theme
themes/unit-01/design-system/  the Unit 01 brand book, tokens and icons
themes/pixel-desk/art/      the scene's Aseprite sources and exports (see its README)
```

The active theme is **Unit 01**, and it wraps the pixel desk rather than
replacing it: the home page frames `DeskScene` as the system's black Display,
and Uses builds its hardware map from the same art exports. The scene itself,
its art and its runtime are untouched. The pixel-desk pages still exist, so
switching back is three import lines in `src/pages/`.

The route files deliberately contain only an import and a render. A theme can
take over the whole site by supplying its own pages, layout, styles and visual
runtime, then becoming the import selected by `src/pages/`. Shared content and
truly theme-neutral components remain above that boundary.

## The scene

`src/themes/pixel-desk/scene/` knows nothing about React or Astro.
`createDeskRoom(canvas, opts)` takes a canvas and returns something with
`start()`, `stop()` and `set()`. That boundary is what made moving from Next.js
to a Vite SPA to Astro cost almost nothing, and it is worth keeping true.

`src/themes/pixel-desk/components/DeskScene.tsx` is the theme's one React island.
It ships on the home page only; the other pages send no JavaScript at all.

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
trust. `dist/` holds three HTML files, and `grep` finds no trace of the panel in
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

The site uses **Unit 01**: pocket hardware read like a museum wall. Black,
white and one orange; Libre Franklin for every word and IBM Plex Mono only for
numbers a machine counts; sections open with a 2px rule rather than sitting in
boxes. Pages use the apps' frame: a heavy title bar, rule-topped modules, and
the pixel scene set bare as the centrepiece of Home and Uses.

The layout is fluid in tiers, and navigation takes a different form in each:
on phones a menu key opens a sheet of page keys, from 720px the keys sit
inline in the title bar, and from 1100px the index and outbound links become a
left column. The current page's key inverts to ink with its LED lit,
the screen's one orange. The brand book and canonical
tokens are in `themes/unit-01/design-system/`; `src/themes/unit-01/styles.css`
carries them as CSS variables with the same names (`--ink`, `--signal`, …).

Gallery (light) and Night (dark) follow the system until a choice is made.
Both the header's Dark switch and the scene's light switch write the one value
in `src/themes/pixel-desk/theme.ts`, so the lamp and the page always agree, and
the scene watches the `data-theme` attribute to follow a change made outside it.

### The pixel-desk theme

What follows describes the earlier pixel-desk theme, kept in the repository.

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
