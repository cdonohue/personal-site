import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EVENT_ASSETS, SHEET_ASSETS } from '../src/themes/pixel-desk/scene/sheet-assets.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const artDirectory = path.join(root, 'dist', 'art')
const required = Object.values(SHEET_ASSETS).flatMap((name) => [
  `${name}.png`,
  `${name}.json`,
]).concat([
  `screen-${EVENT_ASSETS.jigsawScreen}.png`,
  `screen-${EVENT_ASSETS.jigsawScreen}.json`,
  EVENT_ASSETS.jigsawAudio,
])
const missing = required.filter((file) => !fs.existsSync(path.join(artDirectory, file)))

if (missing.length > 0) {
  throw new Error(
    `build is missing runtime art assets:\n${missing.map((file) => `- dist/art/${file}`).join('\n')}`,
  )
}

console.log(`verified ${required.length} runtime art assets in dist/art`)
