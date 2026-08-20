import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Exports Aseprite sprites as part of the Vite build, and serves them straight
 * out of the art folder in dev.
 *
 * The point is that `art/<name>.aseprite` is the only source of truth. The PNG
 * and JSON beside it are build output, and nothing is ever copied anywhere —
 * a duplicate under public/ is exactly how the page ended up rendering art
 * hours older than the file being edited.
 *
 * The JSON is not optional extra: it carries frame durations, tags, and the
 * slices that position the monitor and clock overlays. Exporting only a PNG
 * (File > Export As in the GUI) silently drops all of it.
 */

const DEFAULT_ASEPRITE = '/Applications/Aseprite.app/Contents/MacOS/aseprite';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.json': 'application/json',
};

export type AsepriteOptions = {
  /** Folder holding the .aseprite files. */
  dir: string;
  /** URL prefix the exports are served under. Default '/art'. */
  base?: string;
  /** Path to the Aseprite binary. Falls back to $ASEPRITE then the macOS default. */
  binary?: string;
  /**
   * Layers to additionally export on their own, as `<sprite>.<layer>.png`.
   * Used for lighting masks, which have to stay separate from the flattened
   * room so the page can control their opacity — and so the monitor and clock
   * can be drawn on top of them and stay lit while the room goes dark.
   */
  layers?: Record<string, string[]>;
  /**
   * Alternate flattened renders, as `<sprite>.<variant>.png`, produced by
   * showing and hiding named layers.
   *
   * The night room is a variant rather than a window mask because a flattened
   * render keeps occlusion correct — the mic arm and desk stay in front of the
   * glass, which a rectangle drawn at runtime could not manage.
   */
  variants?: Record<string, Record<string, { hide?: string[]; show?: string[] }>>;
};

const binaryFor = (options: AsepriteOptions) =>
  options.binary ?? process.env.ASEPRITE ?? DEFAULT_ASEPRITE;

const spriteNames = (dir: string) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.aseprite'))
    .map((file) => path.basename(file, '.aseprite'));

type Variants = Record<string, { hide?: string[]; show?: string[] }>;

const suffixed = (name: string, suffix: string) => `${name}.${suffix}.png`;

const outputsFor = (dir: string, name: string, layers: string[], variants: Variants) => [
  path.join(dir, `${name}.png`),
  path.join(dir, `${name}.json`),
  ...layers.map((layer) => path.join(dir, suffixed(name, layer))),
  ...Object.keys(variants).map((variant) => path.join(dir, suffixed(name, variant))),
];

/** An export is stale when any output is missing or older than the source. */
const isStale = (dir: string, name: string, layers: string[], variants: Variants) => {
  const source = fs.statSync(path.join(dir, `${name}.aseprite`)).mtimeMs;
  return outputsFor(dir, name, layers, variants).some(
    (file) => !fs.existsSync(file) || fs.statSync(file).mtimeMs < source,
  );
};

const exportSprite = (
  binary: string,
  dir: string,
  name: string,
  layers: string[],
  variants: Variants,
) => {
  execFileSync(
    binary,
    [
      '-b',
      `${name}.aseprite`,
      '--sheet',
      `${name}.png`,
      '--sheet-type',
      'horizontal',
      '--data',
      `${name}.json`,
      '--format',
      'json-array',
      '--list-layers',
      '--list-tags',
      '--list-slices',
    ],
    { cwd: dir, stdio: 'pipe' },
  );

  // One layer at a time via Lua. The CLI's --layer flag silently exports the
  // whole flattened sprite when combined with --all-layers, so a hidden layer
  // looks like it exported fine and is actually the entire room.
  for (const layer of layers) {
    execFileSync(
      binary,
      [
        '-b',
        `${name}.aseprite`,
        '--script-param',
        `layer=${layer}`,
        '--script-param',
        `out=${path.join(dir, suffixed(name, layer))}`,
        '--script',
        path.join(dir, 'scripts', 'export-layer.lua'),
      ],
      { cwd: dir, stdio: 'pipe' },
    );
  }

  for (const [variant, { hide = [], show = [] }] of Object.entries(variants)) {
    execFileSync(
      binary,
      [
        '-b',
        `${name}.aseprite`,
        '--script-param',
        `hide=${hide.join(',')}`,
        '--script-param',
        `show=${show.join(',')}`,
        '--script-param',
        `out=${path.join(dir, suffixed(name, variant))}`,
        '--script',
        path.join(dir, 'scripts', 'export-variant.lua'),
      ],
      { cwd: dir, stdio: 'pipe' },
    );
  }
};

export default function aseprite(options: AsepriteOptions): Plugin {
  const dir = path.resolve(options.dir);
  const base = options.base ?? '/art';
  const binary = binaryFor(options);
  const layersFor = (name: string) => options.layers?.[name] ?? [];
  const variantsFor = (name: string) => options.variants?.[name] ?? {};

  let warnedMissingBinary = false;
  // Rollup's this.warn() is filtered out at Vite's default log level, which
  // would make a stale build silent. The Vite logger always prints.
  let logger: { info: (message: string) => void; warn: (message: string) => void } = {
    info: (message) => console.log(message),
    warn: (message) => console.warn(message),
  };

  /**
   * Returns the names it actually exported. A missing Aseprite is a warning,
   * not an error: the committed PNG/JSON are still there, so a teammate or CI
   * box without the app installed can still run and build the page.
   */
  const exportStale = (names = spriteNames(dir)) => {
    const stale = names.filter((name) => isStale(dir, name, layersFor(name), variantsFor(name)));
    if (stale.length === 0) return [];

    if (!fs.existsSync(binary)) {
      if (!warnedMissingBinary) {
        warnedMissingBinary = true;
        logger.warn(
          `aseprite: binary not found at ${binary} — shipping the existing exports, ` +
            `which are older than ${stale.join(', ')}. ` +
            `Set ASEPRITE=/path/to/aseprite to re-export.`,
        );
      }
      return [];
    }

    const exported: string[] = [];
    for (const name of stale) {
      try {
        exportSprite(binary, dir, name, layersFor(name), variantsFor(name));
        logger.info(`aseprite: exported ${name}`);
        exported.push(name);
      } catch (cause) {
        logger.warn(
          `aseprite: failed to export ${name} — ${cause instanceof Error ? cause.message : cause}`,
        );
      }
    }
    return exported;
  };

  return {
    name: 'aseprite',

    configResolved(config) {
      logger = config.logger;
    },

    buildStart() {
      exportStale();
    },

    configureServer(server) {
      exportStale();

      // Watch the folder, not a glob: Vite 6 ships chokidar 4, which dropped
      // glob support, so `add('*.aseprite')` would silently watch nothing.
      // The art folder is outside the Vite root, so it has to be added by hand.
      server.watcher.add(dir);
      const onChange = (file: string) => {
        if (path.dirname(file) !== dir || !file.endsWith('.aseprite')) return;
        const name = path.basename(file, '.aseprite');
        if (exportStale([name]).length > 0) server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);

      // Serve the exports in place. No copy into public/, so there is only ever
      // one version of each asset on disk.
      server.middlewares.use((request, response, next) => {
        const url = (request.url ?? '').split('?')[0];
        if (!url.startsWith(`${base}/`)) return next();

        const name = path.basename(url);
        const file = path.join(dir, name);
        const extension = path.extname(name);
        if (!MIME[extension] || path.dirname(file) !== dir || !fs.existsSync(file)) return next();

        response.setHeader('Content-Type', MIME[extension]);
        response.setHeader('Cache-Control', 'no-cache');
        response.end(fs.readFileSync(file));
      });
    },

    // Emit the exports as build assets so dist/ gets art/<name>.<ext>.
    generateBundle() {
      for (const name of spriteNames(dir)) {
        for (const file of outputsFor(dir, name, layersFor(name), variantsFor(name))) {
          if (!fs.existsSync(file)) continue;
          this.emitFile({
            type: 'asset',
            fileName: `${base.replace(/^\//, '')}/${path.basename(file)}`,
            source: fs.readFileSync(file),
          });
        }
      }
    },
  };
}
