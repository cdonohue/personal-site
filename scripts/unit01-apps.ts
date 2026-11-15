/**
 * Everything the Unit 01 apps share beyond their own markup: installability,
 * offline use, and weights (design system rule 8).
 *
 *   npm run unit01:apps                  head tags, manifests, service worker,
 *                                        weights runtime
 *   npm run unit01:apps -- --icons       the same, plus redraw the icons
 *
 * Each app in public/projects/unit-01/apps/<slug>/ gets:
 *
 * - manifest.webmanifest, scoped to its own folder, so each installs as its
 *   own app with its own name and icon rather than all 24 as one
 * - icons/ (180px Apple touch icon, 192px and 512px, and a 512px maskable)
 * - a marked block in its <head> with the manifest link, theme colour, Apple
 *   standalone tags, safe-area padding, service worker registration, and the
 *   app's weights from src/projects/unit-01/catalogue.ts
 *
 * All apps share one service worker, apps/sw.js, registered once per app
 * with that app's folder as its scope, and one weights runtime,
 * apps/unit01-weights.js, copied from scripts/unit01-weights.js.
 *
 * Idempotent: the head block sits between markers and is replaced on every
 * run, so the apps stay otherwise as handed off and a re-run is a no-op.
 *
 * Icons are each app's glyph from the catalogue, rendered in Playwright's
 * Chromium. That needs Playwright installed, which is why it is opt-in; the
 * PNGs are committed.
 */
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE, apps, glyphs, pianoApps, weights } from '../src/projects/unit-01/catalogue.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appsDir = path.join(root, 'public', 'projects', 'unit-01', 'apps')
const appsUrl = `${BASE}/apps`

const START = '<!-- unit01-app:start -->'
const END = '<!-- unit01-app:end -->'
// The block's name before it carried weights too; replaced on the next run.
const LEGACY = ['<!-- unit01-pwa:start -->', '<!-- unit01-pwa:end -->']

const RUNTIME = 'unit01-weights.js'
const runtimeSource = path.join(root, 'scripts', RUNTIME)
// The sampled piano, for the apps in pianoApps. Its samples are served from
// samplesUrl and cached by the service worker as they are played.
const PIANO = 'unit01-piano.js'
const pianoSource = path.join(root, 'scripts', PIANO)
const samplesUrl = `${BASE}/samples/`

const GALLERY = '#ffffff'
const NIGHT = '#000000'

const ICONS = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  // Android masks icons to shapes as small as a circle of 40% radius, so the
  // maskable copy shrinks the drawing into that safe zone.
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
]

const manifestFor = (app: (typeof apps)[number]) => {
  const scope = `${appsUrl}/${app.slug}/`
  return {
    id: scope,
    name: `${app.name} · Unit 01`,
    short_name: app.name,
    description: app.idea,
    start_url: scope,
    scope,
    display: 'standalone',
    background_color: GALLERY,
    theme_color: GALLERY,
    icons: [
      { src: `${scope}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${scope}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${scope}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

/*
 * What goes in each app's <head>.
 *
 * Status bar: `default`, so iOS keeps the app below the status bar and colours
 * the bar from theme-color. `black-translucent` would put the app under it
 * with white text, unreadable on the Gallery theme.
 *
 * theme-color follows the system until the app's own Dark switch sets
 * data-theme on <html>, then follows that — the apps already own the switch,
 * so this only watches the attribute rather than editing 24 handlers.
 */
const headBlock = (app: (typeof apps)[number]) => {
  const scope = `${appsUrl}/${app.slug}/`
  return `${START}
<link rel="manifest" href="${scope}manifest.webmanifest">
<meta name="theme-color" content="${GALLERY}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${NIGHT}" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${app.name}">
<link rel="apple-touch-icon" href="${scope}icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="${scope}icons/icon-192.png">
<style>
/* Installed and full-screen, keep the app clear of the notch, the rounded
   corners and the home indicator. env() is 0 everywhere else. */
.shell { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
</style>
<script>
(function () {
  var root = document.documentElement;
  function sync() {
    var t = root.dataset.theme;
    if (!t) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', t === 'dark' ? '${NIGHT}' : '${GALLERY}');
    });
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('${appsUrl}/sw.js', { scope: '${scope}' }).catch(function () {});
    });
  }
})();
</script>
<script>window.UNIT01_WEIGHTS = ${JSON.stringify(weights[app.slug] ?? {})};</script>
<script src="${appsUrl}/${RUNTIME}" defer></script>${pianoApps.includes(app.slug) ? `\n<script src="${appsUrl}/${PIANO}" defer></script>` : ''}
${END}`
}

/** Replace the marked block, or insert it before </head> on the first run. */
const withHead = (html: string, block: string) => {
  const viewport = html.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    // viewport-fit=cover is what makes env(safe-area-inset-*) report the
    // real insets.
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  )
  for (const [open, close] of [[START, END], LEGACY]) {
    const start = viewport.indexOf(open)
    if (start >= 0) {
      const end = viewport.indexOf(close, start) + close.length
      return viewport.slice(0, start) + block + viewport.slice(end)
    }
  }
  if (!viewport.includes('</head>')) throw new Error('no </head> to insert before')
  return viewport.replace('</head>', `${block}\n</head>`)
}

/*
 * The shared service worker. One file, one registration per app; each
 * instance only touches its own scope, so apps cache and update separately.
 *
 * - The page: network first, so a new version arrives as soon as there is a
 *   connection, falling back to the cached copy offline.
 * - The app's own files (manifest, icons): cache first.
 * - Google Fonts: cache first, shared across apps, so type survives offline.
 */
const serviceWorker = (version: string) => `/* Unit 01 apps — generated by scripts/unit01-apps.ts. Do not edit by hand. */
var VERSION = '${version}';
var SCOPE = self.registration.scope;
var CACHE = 'unit01:' + new URL(SCOPE).pathname + ':' + VERSION;
var FONTS = 'unit01:fonts';
var RUNTIME = '${appsUrl}/${RUNTIME}';
var PIANO = '${appsUrl}/${PIANO}';
var SAMPLES = '${samplesUrl}';
var SAMPLE_CACHE = 'unit01:samples';
var SHELL = [SCOPE, SCOPE + 'manifest.webmanifest', SCOPE + 'icons/apple-touch-icon.png', SCOPE + 'icons/icon-192.png', SCOPE + 'icons/icon-512.png', SCOPE + 'icons/icon-maskable-512.png', RUNTIME];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  var prefix = 'unit01:' + new URL(SCOPE).pathname + ':';
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(prefix) === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fromCache(name, request) {
  return caches.open(name).then(function (cache) {
    return cache.match(request).then(function (hit) {
      return hit || fetch(request).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(fromCache(FONTS, req));
    return;
  }
  // The shared weights runtime lives beside the apps, outside any one scope.
  if (url.origin === self.location.origin && (url.pathname === RUNTIME || url.pathname === PIANO)) {
    event.respondWith(fromCache(CACHE, req));
    return;
  }
  // Samples never change, so they are kept across versions and shared by
  // every app: cached the first time each is played, then offline after.
  if (url.origin === self.location.origin && url.pathname.indexOf(SAMPLES) === 0) {
    event.respondWith(fromCache(SAMPLE_CACHE, req));
    return;
  }
  if (url.href.indexOf(SCOPE) !== 0) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(SCOPE, copy); });
      return res;
    }).catch(function () {
      return caches.open(CACHE).then(function (cache) { return cache.match(SCOPE); });
    }));
    return;
  }
  event.respondWith(fromCache(CACHE, req));
});
`

/*
 * The icon: the app's glyph from the catalogue, set large on the black screen,
 * with the system's one orange LED. The name is left to the home-screen
 * label, which iOS and Android print under every icon anyway.
 */
const iconHtml = (app: (typeof apps)[number], size: number, maskable = false) => `<!doctype html>
<html><head>
<style>
  html, body { margin: 0; }
  .icon { position: relative; width: ${size}px; height: ${size}px; background: #0b0b0b; color: #f2f2ef; overflow: hidden; }
  .art { position: absolute; inset: 0; ${maskable ? 'transform: scale(0.72);' : ''} }
  .led { position: absolute; right: 14%; top: 14%; width: ${Math.round(size * 0.065)}px; height: ${Math.round(size * 0.065)}px; border-radius: 50%; background: #ff5a1f; }
  svg { position: absolute; left: 22%; top: 22%; width: 56%; height: 56%; fill: currentColor; }
</style></head>
<body><div class="icon"><div class="art"><span class="led"></span><svg viewBox="0 0 24 24">${glyphs[app.slug]}</svg></div></div></body></html>`

const renderIcons = async () => {
  // Resolved at runtime and only for --icons, so the rest of the script needs
  // nothing beyond Node. require rather than import(): it honours NODE_PATH,
  // which is how a globally installed Playwright is usually found.
  const { chromium } = createRequire(import.meta.url)('playwright')
  const browser = await chromium.launch()
  try {
    for (const app of apps) {
      const dir = path.join(appsDir, app.slug, 'icons')
      fs.mkdirSync(dir, { recursive: true })
      for (const { file, size, maskable } of ICONS) {
        const page = await browser.newPage({ viewport: { width: size, height: size } })
        await page.setContent(iconHtml(app, size, maskable))
        await page.screenshot({ path: path.join(dir, file), clip: { x: 0, y: 0, width: size, height: size } })
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
}

const main = async () => {
  if (process.argv.includes('--icons')) await renderIcons()

  for (const app of apps) {
    if (!glyphs[app.slug]) throw new Error(`no glyph for ${app.slug} in the catalogue`)
    if (!weights[app.slug]) throw new Error(`no weights for ${app.slug} in the catalogue`)
  }
  const runtime = fs.readFileSync(runtimeSource, 'utf8')
  fs.writeFileSync(path.join(appsDir, RUNTIME), runtime)
  const piano = fs.readFileSync(pianoSource, 'utf8')
  fs.writeFileSync(path.join(appsDir, PIANO), piano)

  const hash = createHash('sha256').update(runtime).update(piano)
  for (const app of apps) {
    const dir = path.join(appsDir, app.slug)
    const indexPath = path.join(dir, 'index.html')
    if (!fs.existsSync(indexPath)) throw new Error(`missing app: ${app.slug}`)
    for (const { file } of ICONS) {
      if (!fs.existsSync(path.join(dir, 'icons', file))) {
        throw new Error(`missing icon ${app.slug}/icons/${file}; run with --icons`)
      }
    }

    const manifest = `${JSON.stringify(manifestFor(app), null, 2)}\n`
    fs.writeFileSync(path.join(dir, 'manifest.webmanifest'), manifest)

    const html = withHead(fs.readFileSync(indexPath, 'utf8'), headBlock(app))
    fs.writeFileSync(indexPath, html)

    hash.update(html).update(manifest)
    for (const { file } of ICONS) hash.update(fs.readFileSync(path.join(dir, 'icons', file)))
  }

  // Changes whenever any app, manifest or icon does, so a new deploy retires
  // the old caches instead of serving them forever.
  const version = hash.digest('hex').slice(0, 12)
  fs.writeFileSync(path.join(appsDir, 'sw.js'), serviceWorker(version))
  console.log(`unit01-apps: ${apps.length} apps, service worker ${version}`)
}

await main()
