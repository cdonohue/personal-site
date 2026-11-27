/**
 * Check every Unit 01 app against design system rule 8: core is reachable at
 * every size.
 *
 *   npm run build && npm run preview      (in one terminal)
 *   npm run unit01:audit [base-url]       (default http://localhost:4321)
 *
 * For each app at each of the handoff's five test sizes it checks that:
 *
 * - every weight in src/projects/unit-01/catalogue.ts still matches something
 *   in the app, so a renamed panel cannot silently drop out of the rule
 * - every core part is visible, or reachable through the More key: opening
 *   More shows it, and closing More puts it back where it was
 * - the app does not overflow its window and raises no page errors
 *
 * Exits non-zero on any failure. Needs Playwright.
 */
import { createRequire } from 'node:module'
import { apps, weights } from '../src/projects/unit-01/catalogue.ts'

const { chromium } = createRequire(import.meta.url)('playwright')

const base = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')
const SIZES: [number, number][] = [[200, 200], [390, 844], [844, 390], [1024, 700], [1440, 900]]

type Probe = { selector: string; matched: number; shown: boolean[] }

const failures: string[] = []
const browser = await chromium.launch()

try {
  for (const app of apps) {
    const declared = weights[app.slug] ?? {}
    const coreSelectors = Object.entries(declared).filter(([, w]) => w === 'core').map(([s]) => s)

    for (const [w, h] of SIZES) {
      const where = `${app.slug} ${w}×${h}`
      const context = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' })
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (e: Error) => errors.push(e.message))
      await page.goto(`${base}/projects/unit-01/apps/${app.slug}/`, { waitUntil: 'networkidle' })
      await page.waitForFunction(() => document.querySelector('.u01-more'))

      const probe = (selectors: string[]): Promise<Probe[]> =>
        page.evaluate(
          (sels: string[]) =>
            sels.map((selector) => {
              const els = [...document.querySelectorAll<HTMLElement>(selector)]
              return {
                selector,
                matched: els.length,
                shown: els.map((el) => el.checkVisibility({ checkVisibilityCSS: true })),
              }
            }),
          selectors,
        )

      // Every declared weight must still point at something.
      if (w === 1440) {
        for (const p of await probe(Object.keys(declared))) {
          if (p.matched === 0) failures.push(`${app.slug}: weight selector "${p.selector}" matches nothing`)
        }
      }

      const overflow = await page.evaluate(() => {
        const shell = document.querySelector('.shell') ?? document.documentElement
        return shell.scrollWidth - shell.clientWidth
      })
      if (overflow > 0) failures.push(`${where}: overflows by ${overflow}px`)

      const before = await probe(coreSelectors)
      const hidden = before.filter((p) => p.shown.some((s) => !s))
      if (hidden.length) {
        const more = page.locator('.u01-more')
        if (!(await more.isVisible())) {
          failures.push(`${where}: core hidden with no More key: ${hidden.map((p) => p.selector).join(', ')}`)
        } else {
          await more.click()
          const inSheet = await page.evaluate(
            (sels: string[]) =>
              sels.map((sel) =>
                [...document.querySelectorAll<HTMLElement>(sel)].every(
                  // Shown, inline or in the sheet; being in the sheet but
                  // still hidden does not count.
                  (el) => el.checkVisibility({ checkVisibilityCSS: true }),
                ),
              ),
            hidden.map((p) => p.selector),
          )
          hidden.forEach((p, i) => {
            if (!inSheet[i]) failures.push(`${where}: core "${p.selector}" not reachable through More`)
          })
          await page.keyboard.press('Escape')
          const restored = await page.evaluate(() => !document.querySelector('.u01-sheet .u01-in-sheet'))
          if (!restored) failures.push(`${where}: closing More did not put parts back`)
        }
      }

      if (errors.length) failures.push(`${where}: page errors: ${errors.join(' | ')}`)
      await context.close()
    }
    process.stdout.write('.')
  }
} finally {
  await browser.close()
}

console.log(`\n${apps.length} apps × ${SIZES.length} sizes`)
if (failures.length) {
  console.log(`${failures.length} failure(s):\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log('every core part is reachable at every size')
