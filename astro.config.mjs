// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import aseprite from './vite-plugin-aseprite.ts'
import {
  ROOM_EXPORT_LAYERS,
  ROOM_EXPORT_VARIANTS,
} from './src/themes/pixel-desk/scene/art.ts'

/**
 * The dev room, which is not a page.
 *
 * The theme workbench sits outside `src/pages/`, so file-based routing cannot
 * find it, and the route is only injected when the command is `dev`. Both
 * together, on purpose: a build has neither a file to route nor a route to
 * build, so there is nothing to tree-shake and nothing to trust.
 */
/** @type {import('astro').AstroIntegration} */
const devRoom = {
  name: 'dev-room',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({
        pattern: '/dev',
        entrypoint: './src/themes/pixel-desk/dev/DevRoom.astro',
      });
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
       * Exports the active theme's Aseprite sources on save and serves the
       * results at /art, so editing a sprite reloads the page. Without Aseprite
       * installed it warns and uses committed exports, so builds work anywhere.
       *
       * Astro runs on Vite, so this plugin moved across unchanged.
       */
      aseprite({
        dir: new URL('./themes/pixel-desk/art', import.meta.url).pathname,
        base: '/art',
        // dark         — lighting mask, faded by the room light and the hour.
        // mic-extended — redrawn over live screen content in the call scene.
        // desk-front — the desk lip, redrawn over anything behind it.
        // desk-items — what rests on the desk.
        // dark — the lighting mask, faded by the room light and the hour. The
        // desk-front and desk-items exports that used to sit here are gone:
        // nothing drew them once the character moved in front of the desk, and
        // they are inside the desk-top piece now.
        layers: { room: ROOM_EXPORT_LAYERS },
        variants: { room: ROOM_EXPORT_VARIANTS },
      }),
    ],
  },
})
