export enum Category {
  HardwareAndPeripherals = 'Hardware and Peripherals',
  DeskAndErgonomics = 'Desk and Ergonomics',
  Videogames = 'Videogames',
  Software = 'Software',
  Miscellaneous = 'Miscellaneous',
}

export type Item = {
  category: Category
  title: string
  description: string
  link: string
  graphic: string
}

export const things: Array<Item> = [
  {
    graphic: '💻',
    title: 'MacBook Pro',
    description:
      'A laptop that looks great, is easy to setup, and packs in a lot of great hardware under the hood to make it perfect to do almost anything.',
    link: 'https://www.apple.com/macbook-pro/',
    category: Category.HardwareAndPeripherals,
  },
  {
    title: 'Gigabyte M32U',
    description:
      'This 32-inch 4K monitor provides ample screen real estate for coding and design work, and it also doubles as a decent gaming display.',
    link: 'https://amzn.to/3RNAmPU',
    category: Category.HardwareAndPeripherals,
    graphic: '🖥',
  },
  {
    title: 'ZSA Voyager',
    description:
      'This compact, split keyboard reduces strain and boosts productivity with its customizable layout and programmable keys.',
    link: 'https://www.zsa.io/voyager/',
    category: Category.HardwareAndPeripherals,
    graphic: '⌨️',
  },
  {
    title: 'CalDigit TS4',
    description:
      'This Thunderbolt dock transforms any laptop into a full-fledged workstation, connecting multiple displays and peripherals with a single cable for a streamlined setup.',
    link: 'https://amzn.to/3XHYTcd',
    category: Category.HardwareAndPeripherals,
    graphic: '🔌',
  },
  {
    title: 'BD DT 900 Pro X',
    description:
      'These open-back headphones deliver crystal-clear sound for precise audio work and immersive music breaks, keeping me focused and inspired throughout my day.',
    link: 'https://amzn.to/3W1fkQm',
    category: Category.HardwareAndPeripherals,
    graphic: '🎵',
  },
  {
    title: 'Shure MV7',
    description:
      'This versatile microphone delivers podcast-quality audio for client calls and team meetings, ensuring my ideas come across crystal clear.',
    link: 'https://amzn.to/3zmNR2E',
    category: Category.HardwareAndPeripherals,
    graphic: '🎤',
  },
]
