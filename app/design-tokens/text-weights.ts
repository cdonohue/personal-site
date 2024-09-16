import { StaticToken } from './types'

const textWeights = {
  title: 'Text Weights',
  description: 'Helper classes and custom properties for common font weights',
  meta: {},
  items: [
    {
      name: 'Regular',
      value: 400,
    },
    {
      name: 'Medium',
      value: 500,
    },
    {
      name: 'Bold',
      value: 700,
    },
  ] as Array<StaticToken>,
}

export { textWeights }
