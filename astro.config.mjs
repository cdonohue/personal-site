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

const weatherVariants = Object.fromEntries(
  SKIES.map((sky) => [sky, { hide: SKIES.filter((other) => other !== sky), show: [sky] }]),
)

export default defineConfig({
  // React is here for one component: the scene needs hooks and a ref to a live
  // canvas, so it ships as an island. Every page around it is static HTML.
  integrations: [react()],

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
        // dark       — lighting mask, faded by the room light and the hour.
        // desk-front — the desk lip, redrawn over anything behind it.
        // desk-items — what rests on the desk.
        layers: { room: ['dark', 'desk-front', 'desk-items'] },
        variants: { room: weatherVariants },
      }),
    ],
  },
})
