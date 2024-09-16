import { sand, sandA, orange, brown } from '@radix-ui/colors'
import { startCase } from 'lodash'
import { StaticToken } from './types'

function radixColorsToArray(
  color: { [key: string]: string },
  label: string = ''
) {
  const shades = []
  for (const shade in color) {
    shades.push({
      name: label
        ? startCase(`${label}${shade.replace(/\D/g, '')}`)
        : startCase(shade),
      value: color[shade],
    })
  }

  return shades
}

const colors = {
  title: 'Colors',
  description:
    'Hex color codes that can be shared, cross-platform. They can be converted at point of usage, such as HSL for web or CMYK for print.',
  items: [
    ...radixColorsToArray(sand, 'neutral'),
    ...radixColorsToArray(sandA, 'neutral-a'),
    ...radixColorsToArray(orange, 'primary'),
    ...radixColorsToArray(brown, 'secondary'),
  ] as Array<StaticToken>,
}

export { colors }
