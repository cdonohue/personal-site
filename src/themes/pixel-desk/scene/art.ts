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

export const roomLayerPath = (basePath: string, layer: keyof typeof ROOM_LAYER_EXPORTS) =>
  artPath(basePath, `room.${ROOM_LAYER_EXPORTS[layer]}`)

export const roomVariantPath = (basePath: string, variant: keyof typeof ROOM_VARIANT_EXPORTS) =>
  artPath(basePath, `room.${ROOM_VARIANT_EXPORTS[variant]}`)

export const skyPath = (basePath: string, sky: string) => artPath(basePath, `room.${sky}`)
