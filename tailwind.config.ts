import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import postcss from 'postcss'
import postcssJs from 'postcss-js'

import defaultTheme from 'tailwindcss/defaultTheme'

import {
  colors as colorTokens,
  fonts as fontTokens,
  shadows as shadowTokens,
  spacing as spacingTokens,
  textSizes as textSizeTokens,
  textWeights as textWeightTokens,
  textLeading as textLeadingTokens,
  viewports as viewportTokens,
  tokensToTailwind,
} from './app/design-tokens'

const boxShadow = tokensToTailwind(shadowTokens.items)
const colors = tokensToTailwind(colorTokens.items)
const fontFamily = tokensToTailwind(fontTokens.items)
const fontSize = tokensToTailwind(textSizeTokens.items)
const fontWeight = tokensToTailwind(textWeightTokens.items)
const lineHeight = tokensToTailwind(textLeadingTokens.items)
const spacing = tokensToTailwind(spacingTokens.items)

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // gap
    ...Object.keys(spacing).map((key) => `gap-${key}`),
    // padding
    ...Object.keys(spacing).map((key) => `p-${key}`),
    ...Object.keys(spacing).map((key) => `pl-${key}`),
    ...Object.keys(spacing).map((key) => `pr-${key}`),
    ...Object.keys(spacing).map((key) => `pt-${key}`),
    ...Object.keys(spacing).map((key) => `pb-${key}`),
    ...Object.keys(spacing).map((key) => `px-${key}`),
    ...Object.keys(spacing).map((key) => `py-${key}`),

    'items-center',
    'items-baseline',
    'items-start',
    'items-end',
    'items-stretch',
  ],
  presets: [],
  theme: {
    screens: {
      sm: `${viewportTokens.min}px`,
      md: `${viewportTokens.mid}px`,
      lg: `${viewportTokens.max}px`,
    },
    boxShadow,
    colors,
    spacing,
    fontSize,
    lineHeight,
    fontFamily: {
      sans: ['var(--font-geist-sans)'],
      mono: ['var(--font-geist-mono)'],
    },
    fontWeight,
    backgroundColor: ({ theme }) => theme('colors'),
    textColor: ({ theme }) => theme('colors'),
    margin: ({ theme }) => ({
      auto: 'auto',
      ...theme('spacing'),
    }),
    flex: defaultTheme.flex,
    width: ({ theme }) => theme('spacing'),
    height: ({ theme }) => theme('spacing'),
    padding: ({ theme }) => theme('spacing'),
    gap: ({ theme }) => theme('spacing'),
    divideWidth: ({ theme }) => theme('spacing'),
    borderColor: ({ theme }) => theme('colors'),
    borderWidth: defaultTheme.borderWidth,
    borderStyle: defaultTheme.borderStyle,
    borderRadius: defaultTheme.borderRadius,
    outlineColor: ({ theme }) => theme('colors'),
    outlineWidth: defaultTheme.borderWidth,
  },
  variantOrder: [
    'first',
    'last',
    'odd',
    'even',
    'visited',
    'checked',
    'empty',
    'read-only',
    'group-hover',
    'group-focus',
    'focus-within',
    'hover',
    'focus',
    'focus-visible',
    'active',
    'disabled',
  ],
  // Disables Tailwind's usage of rgb/opacity
  corePlugins: {
    textOpacity: false,
    backgroundOpacity: false,
    borderOpacity: false,
  },
  // Prevents Tailwind's core components
  blocklist: ['container'],

  // Prevents Tailwind from generating that wall of empty custom properties
  experimental: {
    optimizeUniversalDefaults: true,
  },

  plugins: [
    // Generates custom property values from tailwind config
    plugin(function ({ addComponents, config }) {
      let result = ''

      const currentConfig = config()

      const groups = [
        { key: 'colors', prefix: 'color' },
        { key: 'spacing', prefix: 'space' },
        { key: 'fontSize', prefix: 'size' },
        { key: 'lineHeight', prefix: 'leading' },
        { key: 'fontFamily', prefix: 'font' },
        { key: 'fontWeight', prefix: 'font' },
        { key: 'boxShadow', prefix: 'shadow' },
        { key: 'borderRadius', prefix: 'radius' },
      ]

      groups.forEach(({ key, prefix }) => {
        const group = currentConfig.theme![key]

        if (!group) {
          return
        }

        Object.keys(group).forEach((key) => {
          result += `--${prefix}-${key}: ${group[key]};`
        })
      })

      addComponents({
        ':root': postcssJs.objectify(postcss.parse(result)),
      })
    }),

    // Generates custom utility classes
    plugin(function ({ addUtilities, config }) {
      const currentConfig = config()
      const customUtilities = [
        { key: 'spacing', prefix: 'flow-space', property: '--flow-space' },
        { key: 'spacing', prefix: 'region-space', property: '--region-space' },
        { key: 'spacing', prefix: 'gutter', property: '--gutter' },
      ]

      customUtilities.forEach(({ key, prefix, property }) => {
        const group = currentConfig.theme![key]

        if (!group) {
          return
        }

        Object.keys(group).forEach((key) => {
          addUtilities({
            [`.${prefix}-${key}`]: postcssJs.objectify(
              postcss.parse(`${property}: ${group[key]}`)
            ),
          })
        })
      })
    }),
  ],
}
export default config
