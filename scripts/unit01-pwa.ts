/**
 * Make every Unit 01 app an installable, offline-capable web app.
 *
 *   node scripts/unit01-pwa.ts            manifests, head tags, service worker
 *   node scripts/unit01-pwa.ts --icons    the same, plus regenerate the icons
 *
 * Each app in public/projects/unit-01/apps/<slug>/ gets:
 *
 * - manifest.webmanifest, scoped to its own folder, so each installs as its
 *   own app with its own name and icon rather than all 24 as one
 * - icons/ (180px Apple touch icon, 192px and 512px, and a 512px maskable)
 * - a marked block in its <head> with the manifest link, theme colour, Apple
 *   standalone tags, safe-area padding and service worker registration
 *
 * All apps share one service worker, apps/sw.js, registered once per app
 * with that app's folder as its scope.
 *
 * Idempotent: the head block sits between markers and is replaced on every
 * run, so the apps stay otherwise as handed off and a re-run is a no-op.
 *
 * Icons are drawn by rendering HTML in Playwright's Chromium, so the type is
 * the real Libre Franklin. That needs Playwright installed and network access
 * to Google Fonts, which is why it is opt-in; the PNGs are committed.
 */
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE, apps } from '../src/projects/unit-01/catalogue.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appsDir = path.join(root, 'public', 'projects', 'unit-01', 'apps')
const appsUrl = `${BASE}/apps`

const START = '<!-- unit01-pwa:start -->'
const END = '<!-- unit01-pwa:end -->'

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

const indexOf = (slug: string) => slug.slice(0, 2)

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
  const start = viewport.indexOf(START)
  if (start >= 0) {
    const end = viewport.indexOf(END, start) + END.length
    return viewport.slice(0, start) + block + viewport.slice(end)
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
const serviceWorker = (version: string) => `/* Unit 01 apps — generated by scripts/unit01-pwa.ts. Do not edit by hand. */
var VERSION = '${version}';
var SCOPE = self.registration.scope;
var CACHE = 'unit01:' + new URL(SCOPE).pathname + ':' + VERSION;
var FONTS = 'unit01:fonts';
var SHELL = [SCOPE, SCOPE + 'manifest.webmanifest', SCOPE + 'icons/apple-touch-icon.png', SCOPE + 'icons/icon-192.png', SCOPE + 'icons/icon-512.png', SCOPE + 'icons/icon-maskable-512.png'];

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
 * The icon: the app's number set heavy on the black screen, the way Unit 01
 * uses type as the image, with the one orange LED. The name is left to the
 * home screen label, which iOS and Android print under every icon anyway.
 */
const iconHtml = (app: (typeof apps)[number], size: number, maskable = false) => `<!doctype html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@800&family=IBM+Plex+Mono:wght@500&display=block" rel="stylesheet">
<style>
  html, body { margin: 0; }
  .icon { position: relative; width: ${size}px; height: ${size}px; background: #0b0b0b; color: #f2f2ef; overflow: hidden; }
  .art { position: absolute; inset: 0; ${maskable ? 'transform: scale(0.68);' : ''} }
  .label { position: absolute; left: 16%; top: 16%; font: 500 ${Math.round(size * 0.07)}px/1 "IBM Plex Mono", monospace; letter-spacing: .08em; color: #8f8f8a; }
  .led { position: absolute; right: 16%; top: 16%; width: ${Math.round(size * 0.07)}px; height: ${Math.round(size * 0.07)}px; border-radius: 50%; background: #ff5a1f; }
  .num { position: absolute; left: 13%; bottom: 10%; font: 800 ${Math.round(size * 0.5)}px/1 "Libre Franklin", sans-serif; letter-spacing: -.05em; }
</style></head>
<body><div class="icon"><div class="art"><span class="label">UNIT 01</span><span class="led"></span><span class="num">${indexOf(app.slug)}</span></div></div></body></html>`

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
        await page.setContent(iconHtml(app, size, maskable), { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
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

  const hash = createHash('sha256')
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
  console.log(`unit01-pwa: ${apps.length} apps, service worker ${version}`)
}

await main()
