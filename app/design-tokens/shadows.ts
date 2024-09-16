import { StaticToken } from './types'

const shadows = {
  title: 'Shadows',
  description: 'Helper classes and custom properties for common font weights',
  meta: {},
  items: [
    {
      name: 'S',
      value: `
         0 1px 2px 0 rgb(0 0 0 / 0.05)
      `,
    },
    {
      name: 'M',
      value: `
        0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
      `,
    },
    {
      name: 'L',
      value: `
        0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
      `,
    },
    {
      name: 'XL',
      value: `
        0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
      `,
    },
  ] as Array<StaticToken>,
}

export { shadows }
