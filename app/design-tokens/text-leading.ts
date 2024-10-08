import { StaticToken } from './types'

const textLeading = {
  title: 'Leading',
  description: 'Ratio-based leading/line-height values',
  items: [
    {
      name: 'Flat',
      value: 1,
    },
    {
      name: 'Fine',
      value: 1.15,
    },
    {
      name: 'Standard',
      value: 1.5,
    },
    {
      name: 'Loose',
      value: 1.7,
    },
  ] as Array<StaticToken>,
}

export { textLeading }
