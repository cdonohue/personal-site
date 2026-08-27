/**
 * Runtime sprite sheets that must exist as matching PNG and JSON build assets.
 *
 * Kept dependency-free so the browser loader, Vite plugin configuration and
 * post-build validator can all consume the same contract.
 */
export const SHEET_ASSETS = {
  room: 'room',
  power: 'screen-power',
  digits: 'digits',
  switchPlate: 'switch',
  weather: 'weather',
  character: 'character',
  chair: 'chair',
  headphones: 'headphones',
  ufo: 'ufo',
} as const

/** Visit-scoped event assets emitted beside the ordinary sprite sheets. */
export const EVENT_ASSETS = {
  jigsawScreen: 'jigsaw',
  jigsawAudio: 'jigsaw-voice.mp3',
} as const
