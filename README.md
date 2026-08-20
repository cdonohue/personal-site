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
art/            Aseprite sources and their exports  (see art/README.md)
src/scene/      the desk scene, framework-agnostic
src/pages/      one .astro file per route
src/content.ts  everything the site says about jobs, tools and links
src/index.css   the whole design system: tokens, roles, type
```

## The scene

`src/scene/` knows nothing about React or Astro. `createDeskRoom(canvas, opts)`
takes a canvas and returns something with `start()`, `stop()` and `set()`. That
is what made moving from Next.js to a Vite SPA to Astro cost almost nothing, and
it is worth keeping true.

`src/components/DeskScene.tsx` is the one React file on the site, and the one
island. It ships on the home page only; the other pages send no JavaScript at
all.

Three things drive it:

- **The weather is real.** Open-Meteo, no key, no permission prompt, fixed
  coordinates for central Houston rather than a home address, cached for half an
  hour.
- **The time is real, and it is not the visitor's.** The clock, dusk and the
  light all read `America/Chicago`, so someone in Tokyo looks in on the room
  rather than at a copy running on their own clock.
- **Who is at the desk is invented.** A weighted roll against the hour,
  re-rolled every minute or two. It was a fixed nine-to-five rule once, which was
  a guess dressed up as a schedule.

The art and the code meet at exactly two places: **slice names** and **tag
names**. `art/README.md` documents that contract and the reasoning behind the
art itself, including the parts that failed first.

## Design

One accent, two typefaces, one size of body text.

Typography is expressed as roles rather than font names: `--font-display` and
`--font-body` in `src/index.css`, and nothing outside that block names a
typeface. Heading *levels* describe the document; `data-role` attributes
describe how things look. The two used to be conflated and it went wrong in both
directions.

Colours come from the scene rather than being invented, so the page and the
illustration read as one thing. Every text colour clears 4.5:1 on its own
background in both schemes.
