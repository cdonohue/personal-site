import { WEATHER_CONDITIONS } from './toggles'

/**
 * The generated-art contract shared by the Node export pipeline and browser
 * loader. This file deliberately imports neither environment.
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
} as const

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

const DESK_VARIANTS = {
  'legs-inner': ['legs-inner'],
  'legs-mid': ['legs-mid'],
  'legs-fixed': ['legs-outer', 'legs-base'],
  'desk-top': [...DESK_TOP_COMMON, 'mic', 'headphones-hanging'],
  'desk-top-call': [...DESK_TOP_COMMON, 'mic-extended'],
}

const DESK_LAYERS = [...new Set(Object.values(DESK_VARIANTS).flat())]
const DESK_GROUP = [...DESK_LAYERS, 'shadow']
const NOT_DESK = ['WEATHER', 'ROOM', 'LIGHTING']

export const SKY_VARIANTS = WEATHER_CONDITIONS.flatMap((weather) => [
  `${weather}-day`,
  `${weather}-night`,
])

export const ROOM_LAYER_EXPORTS = {
  dark: 'dark',
  callMic: 'mic-extended',
} as const

export const ROOM_VARIANT_EXPORTS = {
  deskLegsInner: 'legs-inner',
  deskLegsMid: 'legs-mid',
  deskLegsFixed: 'legs-fixed',
  deskTop: 'desk-top',
  callDeskTop: 'desk-top-call',
} as const

/**
 * Product views derived from the room's source layers for the `/uses` page.
 * Bounds are in the 192x108 room canvas. Product layers live inside scene
 * groups so animation state and product identity remain separate concerns.
 */
export const ROOM_ITEM_EXPORTS = {
  'standing-desk-frame': {
    layers: ['legs-inner', 'legs-mid', 'legs-outer', 'legs-base'],
    crop: [46, 66, 112, 30],
  },
  'desktop-surface': { layers: ['desk-front'], crop: [32, 63, 128, 6] },
  'macbook-pro': { layers: ['macbook-pro'], crop: [37, 43, 31, 19] },
  'kuzy-laptop-vertical-stand': {
    layers: ['kuzy-vertical-stand'],
    crop: [45, 55, 15, 8],
  },
  headphones: { layers: ['headphones-hanging'], crop: [30, 69, 14, 15] },
  'tidbyt-v2': { layers: ['clock'], crop: [124, 53, 23, 11] },
  microphone: { layers: ['microphone-parked'], crop: [141, 42, 6, 11] },
  'elgato-wave-mic-arm': { layers: ['boom-arm-parked'], crop: [145, 35, 21, 28] },
  monitor: { layers: ['screen'], crop: [71, 27, 50, 31] },
  'monitor-arm': { layers: ['arm'], crop: [76, 36, 28, 27] },
  webcam: { layers: ['camera'], crop: [92, 22, 8, 5] },
  'audio-dac': { layers: ['fosi-k7'], crop: [57, 71, 12, 5] },
  'oeveo-under-mount-139': { layers: ['oeveo-tray-left'], crop: [53, 69, 20, 8] },
  'caldigit-ts4': { layers: ['caldigit-ts4'], crop: [123, 71, 12, 5] },
  'keychron-q2-max': { layers: ['keychron-q2-max'], crop: [86, 60, 20, 3] },
  'logitech-mx-master-4': {
    layers: ['logitech-mx-master-4'],
    crop: [109, 60, 5, 3],
  },
} as const

const deskExports = Object.fromEntries(
  Object.entries(DESK_VARIANTS).map(([variant, show]) => [
    variant,
    { hide: [...NOT_DESK, ...DESK_GROUP.filter((layer) => !show.includes(layer))], show },
  ]),
)

const skyExports = Object.fromEntries(
  SKY_VARIANTS.map((sky) => [
    sky,
    { hide: [...SKY_VARIANTS.filter((other) => other !== sky), ...DESK_LAYERS], show: [sky] },
  ]),
)

export const ROOM_EXPORT_LAYERS = Object.values(ROOM_LAYER_EXPORTS)
export const ROOM_EXPORT_VARIANTS = { ...skyExports, ...deskExports }

export const artPath = (basePath: string, name: string) => `${basePath}/${name}`

export const usesItemPath = (basePath: string, item: string) =>
  artPath(basePath, `item-${item}.png`)

export const roomLayerPath = (basePath: string, layer: keyof typeof ROOM_LAYER_EXPORTS) =>
  artPath(basePath, `room.${ROOM_LAYER_EXPORTS[layer]}`)

export const roomVariantPath = (basePath: string, variant: keyof typeof ROOM_VARIANT_EXPORTS) =>
  artPath(basePath, `room.${ROOM_VARIANT_EXPORTS[variant]}`)

export const skyPath = (basePath: string, sky: string) => artPath(basePath, `room.${sky}`)
