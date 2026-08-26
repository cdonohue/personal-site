/**
 * Monitor content and any physical room state that travels with it.
 *
 * Most screens are exactly that: a sheet on the monitor. A few change the room
 * around the monitor as well. Keeping those effects beside the screen prevents
 * the renderer from rediscovering the same screen name in every draw pass.
 */

export type ScreenKind = 'work' | 'play' | 'screensaver' | 'interactive'
export type ScreenSource = 'sheet' | 'scene' | 'camera'

export type ScreenEffects = {
  desk: 'default' | 'call'
  characterOverlay: 'none' | 'headphones'
  screenOverlay: 'none' | 'call-mic'
  cameraIndicator: boolean
}

export type ScreenDefinition = {
  name: string
  kind: ScreenKind
  /** Defaults to an exported `screen-<name>` sheet. */
  source?: ScreenSource
  effects?: Partial<ScreenEffects>
}

const DEFAULT_EFFECTS: ScreenEffects = {
  desk: 'default',
  characterOverlay: 'none',
  screenOverlay: 'none',
  cameraIndicator: false,
}

export const SCREEN_DEFINITIONS = [
  { name: 'ai-work', kind: 'work' },
  {
    name: 'zoom-call',
    kind: 'work',
    effects: {
      desk: 'call',
      characterOverlay: 'headphones',
      screenOverlay: 'call-mic',
      cameraIndicator: true,
    },
  },
  { name: 'game', kind: 'play' },
  { name: 'room-view', kind: 'play', source: 'scene' },
  {
    name: 'webcam',
    kind: 'interactive',
    source: 'camera',
    effects: { cameraIndicator: true },
  },
  { name: 'cube', kind: 'screensaver' },
  { name: 'bounce', kind: 'screensaver' },
  { name: 'aquarium', kind: 'screensaver' },
  { name: 'fireworks', kind: 'screensaver' },
  { name: 'ribbons', kind: 'screensaver' },
  { name: 'orbit', kind: 'screensaver' },
  { name: 'radar', kind: 'screensaver' },
  { name: 'comet', kind: 'screensaver' },
  { name: 'hypno', kind: 'screensaver' },
] as const satisfies readonly ScreenDefinition[]

const namesFor = (kind: ScreenKind) =>
  SCREEN_DEFINITIONS.filter((screen) => screen.kind === kind).map((screen) => screen.name)

export const WORK_TAGS = namesFor('work')
export const PLAY_TAGS = namesFor('play')
export const SCREENSAVER_TAGS = namesFor('screensaver')
export const INTERACTIVE_TAGS = namesFor('interactive')
export const SCREEN_TAGS = [...WORK_TAGS, ...PLAY_TAGS, ...INTERACTIVE_TAGS]
export const FALLBACK_SCREEN_TAG = WORK_TAGS[0]

const definitions = new Map<string, ScreenDefinition>(
  SCREEN_DEFINITIONS.map((screen) => [screen.name, screen]),
)

export const effectsForScreen = (name: string): ScreenEffects => ({
  ...DEFAULT_EFFECTS,
  ...definitions.get(name)?.effects,
})

export const sourceForScreen = (name: string): ScreenSource =>
  definitions.get(name)?.source ?? 'sheet'

/** Host-facing gate for the visitor's real camera, kept beside its screen. */
export const canUseVisitorCamera = ({
  presence,
  screen,
  powered,
}: {
  presence: 'present' | 'away'
  screen: string
  powered: boolean
}) => presence === 'away' && screen !== 'zoom-call' && powered
