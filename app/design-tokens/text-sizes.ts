import { FluidToken } from './types'

const textSizes = {
  title: 'Text Sizes',
  description:
    'A minimum and maximum text size size allows you to pick the right size from a ratio, depending on the context size. The min and max sizes are in pixels and should be converted to appropiate sizes, per context. For example, for web, the should be converted to REM units (pixelSize / baseSize)',
  meta: {
    scaleGenerator:
      'https://utopia.fyi/type/calculator/?c=330,18,1.175,1200,24,1.25,7,1,&s=0.75%7C0.5%7C0.25,1.5%7C2%7C3%7C4%7C6,s-l&g=s,l,xl,12',
  },
  items: [
    {
      name: 'Step 00',
      min: 15,
      max: 16,
    },
    {
      name: 'Step 0',
      min: 18,
      max: 20,
    },
    {
      name: 'Step 1',
      min: 21.6,
      max: 25,
    },
    {
      name: 'Step 2',
      min: 25.92,
      max: 31.25,
    },
    {
      name: 'Step 3',
      min: 31.1,
      max: 39.06,
    },
    {
      name: 'Step 4',
      min: 39.06,
      max: 48.83,
    },
    {
      name: 'Step 5',
      min: 44.79,
      max: 61.04,
    },
  ] as Array<FluidToken>,
}

export { textSizes }
