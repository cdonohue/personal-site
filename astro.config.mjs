// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import aseprite from './vite-plugin-aseprite.ts'
import { WEATHER_CONDITIONS } from './src/scene/toggles.ts'

/**
 * Every weather condition renders as a day/night pair, and the page crossfades
 * between the two by how far into night it is.
 *
 * They are flattened variants rather than masks because WEATHER layers are
 * full-canvas floods the wall occludes everywhere but the glass — flattening is
 * what keeps the mic arm and desk edge in front of the window.
 */
const SKIES = WEATHER_CONDITIONS.flatMap((weather) => [`${weather}-day`, `${weather}-night`])

/**
 * The desk comes out of the room plate so it can move.
 *
 * It used to be flattened into the ten weather variants, which is why it could
 * not: the desk crosses the window by 20px, and the glass mask is derived by
 * diffing clear-day against clear-night — both of which contained it. Move the
 * desk and the mask was wrong.
 *
 * Pulled out, the mask derives from desk-free art and is correct at any height,
 * and occlusion comes from draw order instead of from flattening.
 *
 * The pieces are split by how fast they travel, and the order below is the
 * order they must be drawn in. `legs-outer` and `legs-base` do not move but
 * cannot stay in the plate either: they are drawn *over* the sliding sections,
 * so anything painted before them would come out in front.
 */
const DESK_TOP_COMMON = [
  'clock',
  'mac',
  'surface',
  'desk-items',
  'desk-front',
  'camera',
  'arm',
  'screen',
]

const DESK_PIECES = {
  // Bolted to the desktop: travels the full distance.
  'legs-inner': ['legs-inner'],
  // The middle sleeve, which has a shorter stroke and so moves proportionally
  // less. Drawn over legs-inner.
  'legs-mid': ['legs-mid'],
  // Fixed to the floor, drawn over both sliding sections.
  //
  // `shadow` is deliberately not here. It is fixed too, but it uses an overlay
  // blend, and a blended layer only composites correctly against the pixels it
  // was flattened over — pulled out and drawn back with normal alpha it lands a
  // shade off. It sits on y96 while legs-base ends at y95, so it never overlaps
  // the sliding sections and has no reason to leave the plate.
  'legs-fixed': ['legs-outer', 'legs-base'],
  // The desktop and everything standing on it. Travels with legs-inner.
  'desk-top': [...DESK_TOP_COMMON, 'mic', 'headphones-hanging'],
}

/**
 * The call keeps the same desktop but swaps two authored states: the parked
 * microphone for its extended drawing, and the hanging headphones for no desk
 * drawing at all. The matching headphones-on character overlay is a separate
 * sprite because the person is composed later and can move independently.
 */
const DESK_TOP_CALL = [...DESK_TOP_COMMON, 'mic-extended']

const DESK_VARIANTS = { ...DESK_PIECES, 'desk-top-call': DESK_TOP_CALL }

/** The pieces that leave the plate, so the plate must hide exactly these. */
const DESK_LAYERS = [...new Set(Object.values(DESK_VARIANTS).flat())]

/**
 * Every layer in the DESK group, including `shadow`, which stays in the plate.
 *
 * A piece export has to hide this whole set and then show its own, rather than
 * hiding only the pieces: `shadow` is not a piece, so leaving it out here would
 * let it ride along in every piece and composite twice.
 */
const DESK_GROUP = [...DESK_LAYERS, 'shadow']

/** Everything a desk piece must hide so it exports alone on transparency. */
const NOT_DESK = ['WEATHER', 'ROOM', 'LIGHTING']

const deskVariants = Object.fromEntries(
  Object.entries(DESK_VARIANTS).map(([piece, show]) => [
    piece,
    { hide: [...NOT_DESK, ...DESK_GROUP.filter((l) => !show.includes(l))], show },
  ]),
)

/**
 * Every weather condition renders as a day/night pair, and the page crossfades
 * between the two by how far into night it is.
 *
 * Still flattened rather than masked, because the wall occludes the sky
 * everywhere but the glass. What is no longer in them is the desk.
 */
const weatherVariants = Object.fromEntries(
  SKIES.map((sky) => [
    sky,
    { hide: [...SKIES.filter((other) => other !== sky), ...DESK_LAYERS], show: [sky] },
  ]),
)

/**
 * The dev room, which is not a page.
 *
 * `src/dev/` sits outside `src/pages/`, so file-based routing cannot find it,
 * and the route is only injected when the command is `dev`. Both together, on
 * purpose: a build has neither a file to route nor a route to build, so there
 * is nothing to tree-shake and nothing to trust. `dist/` should hold exactly
 * three HTML files, and does.
 */
/** @type {import('astro').AstroIntegration} */
const devRoom = {
  name: 'dev-room',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/dev', entrypoint: './src/dev/DevRoom.astro' });
    },
  },
};

export default defineConfig({
  // React is here for one component: the scene needs hooks and a ref to a live
  // canvas, so it ships as an island. Every page around it is static HTML.
  integrations: [react(), devRoom],

  vite: {
    plugins: [
      tailwindcss(),
      /**
       * Exports art/*.aseprite on save and serves the results at /art, so
       * editing a sprite reloads the page. Without Aseprite installed it warns
       * and uses the committed exports, so builds still work anywhere.
       *
       * Astro runs on Vite, so this plugin moved across unchanged.
       */
      aseprite({
        dir: new URL('./art', import.meta.url).pathname,
        base: '/art',
        // dark         — lighting mask, faded by the room light and the hour.
        // mic-extended — redrawn over live screen content in the call scene.
        // desk-front — the desk lip, redrawn over anything behind it.
        // desk-items — what rests on the desk.
        // dark — the lighting mask, faded by the room light and the hour. The
        // desk-front and desk-items exports that used to sit here are gone:
        // nothing drew them once the character moved in front of the desk, and
        // they are inside the desk-top piece now.
        layers: { room: ['dark', 'mic-extended'] },
        variants: { room: { ...weatherVariants, ...deskVariants } },
      }),
    ],
  },
})
