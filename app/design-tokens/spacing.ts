import { FluidToken } from './types'

const spacing = {
  title: 'Spacing',
  description:
    'Consistent spacing sizes, based on a ratio, with min and max sizes. This allows you to set spacing based on the context size. For example, min for mobile and max for desktop browsers.',
  meta: {
    scaleGenerator:
      'https://utopia.fyi/space/calculator/?c=330,18,1.2,1200,24,1.25,6,2,&s=0.75|0.5|0.25,1.5|2|3|4|6|8,s-l|s-xl&g=s,l,xl,12',
  },
  items: [
    {
      name: 'Zero',
      min: 0,
      max: 1,
    },
    {
      name: '3XS',
      min: 5,
      max: 6,
    },
    {
      name: '2XS',
      min: 9,
      max: 12,
    },
    {
      name: 'XS',
      min: 14,
      max: 18,
    },
    {
      name: 'S',
      min: 18,
      max: 24,
    },
    {
      name: 'M',
      min: 27,
      max: 36,
    },
    {
      name: 'L',
      min: 36,
      max: 48,
    },
    {
      name: 'XL',
      min: 54,
      max: 72,
    },
    {
      name: '2XL',
      min: 72,
      max: 96,
    },
    {
      name: '3XL',
      min: 108,
      max: 144,
    },
    {
      name: '4XL',
      min: 144,
      max: 192,
    },
    {
      name: '3XS - 2XS',
      min: 5,
      max: 12,
    },
    {
      name: '2XS - XS',
      min: 9,
      max: 18,
    },
    {
      name: 'XS - S',
      min: 14,
      max: 24,
    },
    {
      name: 'S - M',
      min: 18,
      max: 36,
    },
    {
      name: 'M - L',
      min: 27,
      max: 48,
    },
    {
      name: 'L - XL',
      min: 36,
      max: 72,
    },
    {
      name: 'XL - 2XL',
      min: 54,
      max: 96,
    },
    {
      name: '2XL - 3XL',
      min: 72,
      max: 144,
    },
    {
      name: '3XL - 4XL',
      min: 108,
      max: 192,
    },
    {
      name: 'S - L',
      min: 18,
      max: 48,
    },
    {
      name: 'S - XL',
      min: 18,
      max: 72,
    },
  ] as Array<FluidToken>,
}

export { spacing }
