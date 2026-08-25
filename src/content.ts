/**
 * The site's content, kept apart from how any of it looks.
 *
 * The plan is for this same data to be rendered by entirely different designs,
 * so nothing here may describe presentation — no sizes, no ordering hacks, no
 * class names. A theme decides what a job or a link looks like; this decides
 * what they are.
 */

export type Job = {
  title: string
  company: string
  /** Optional: an entry without one renders the company as plain text. */
  url?: string
  date: string
  description: string
}

export type UseItem = {
  id: string
  name: string
  description: string
  href: string
}

export type ElsewhereLink = {
  label: string
  href: string
}

export const siteName = 'Chad Donohue'

/**
 * The nav. `end` marks the route that should only match exactly — without it
 * "/" matches every path and Home would light up on every page.
 */
export const navigation = [
  { label: 'Home', to: '/', end: true },
  { label: 'Experience', to: '/experience' },
  { label: 'Uses', to: '/uses' },
]

/** Was duplicated in two pages and hardcoded in a third. */
export const elsewhere: ElsewhereLink[] = [
  { label: 'X', href: 'https://twitter.com/chaddonohue' },
  { label: 'GitHub', href: 'https://github.com/cdonohue' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/cdonohue' },
]

export const jobs: Job[] = [
  {
    title: 'Senior Software Engineer',
    company: 'Ramp',
    url: 'https://ramp.com',
    date: 'April 2026 - Present',
    description:
      'Tooling for managing vendors and spend, and the agentic experiences built on top of it.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Droplet',
    url: 'https://droplet.io',
    date: 'March 2024 - April 2026',
    description:
      'Document workflow and PDF annotation tools for K-12 schools, and the design system underneath them.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Sleep Doctor',
    url: 'https://sleepdoctor.com',
    date: 'April 2023 - March 2024',
    description: 'Customer data platform and product recommendation engine serving 6M+ users.',
  },
  {
    title: 'Senior Software Engineer / Tech Lead',
    company: 'Webflow',
    url: 'https://webflow.com',
    date: 'November 2019 - April 2023',
    description:
      'Authentication and content scoping enabling visual designers to build membership sites.',
  },
  {
    title: 'Senior Software Engineer',
    company: 'Red Ventures',
    url: 'https://www.redventures.com',
    date: 'November 2015 - November 2019',
    description:
      'Embeddable widget platform with dynamic theming, running across hundreds of domains.',
  },
  {
    title: 'Software Engineer',
    company: 'Apex Capital',
    url: 'https://www.apexcapitalcorp.com',
    date: 'October 2008 - October 2015',
    description:
      'Load board marketplace and credit check systems, and the design standards behind them.',
  },
]

/** Physical hardware in the workspace. Themes decide how to group and present it. */
export const usesItems: UseItem[] = [
  {
    id: 'standing-desk-frame',
    name: 'Autonomous Desk DIY',
    description: 'The adjustable frame underneath the KARLBY desktop.',
    href: 'https://www.autonomous.ai/standing-desks/autonomous-desk-diy',
  },
  {
    id: 'desktop-surface',
    name: 'IKEA KARLBY',
    description: 'A 74-inch walnut countertop used as the desktop surface.',
    href: 'https://www.ikea.com/us/en/p/karlby-countertop-walnut-veneer-50335208/',
  },
  {
    id: 'macbook-pro',
    name: 'MacBook Pro',
    description: 'The computer at the center of the setup.',
    href: 'https://www.apple.com/macbook-pro/',
  },
  {
    id: 'kuzy-laptop-vertical-stand',
    name: 'Kuzy Laptop Vertical Stand',
    description: 'The stand holding the closed MacBook upright.',
    href: 'https://amzn.to/3SAslBc',
  },
  {
    id: 'monitor',
    name: 'Gigabyte M32U',
    description: 'The main display.',
    href: 'https://www.gigabyte.com/Monitor/M32U',
  },
  {
    id: 'monitor-arm',
    name: 'Ergotron LX',
    description: 'The monitor arm that keeps the desktop clear.',
    href: 'https://amzn.to/4cVWUbt',
  },
  {
    id: 'webcam',
    name: 'Opal C1',
    description: 'The camera perched above the display.',
    href: 'https://op.al/',
  },
  {
    id: 'keychron-q2-max',
    name: 'Keychron Q2 Max',
    description: 'The compact mechanical keyboard shown on the desk.',
    href: 'https://amzn.to/4xl8sgD',
  },
  {
    id: 'logitech-mx-master-4',
    name: 'Logitech MX Master 4',
    description: 'The everyday mouse beside the keyboard.',
    href: 'https://amzn.to/4xfW1Tm',
  },
  {
    id: 'microphone',
    name: 'Shure MV7',
    description: 'The microphone that swings in for calls.',
    href: 'https://amzn.to/4y2S2cU',
  },
  {
    id: 'elgato-wave-mic-arm',
    name: 'Elgato Wave Mic Arm',
    description: 'The articulated arm supporting the microphone.',
    href: 'https://amzn.to/4qAaTtr',
  },
  {
    id: 'headphones',
    name: 'beyerdynamic DT 900 PRO X',
    description: 'Open-back headphones for work and calls.',
    href: 'https://amzn.to/4hV2Uow',
  },
  {
    id: 'audio-dac',
    name: 'Fosi Audio K7',
    description: 'The DAC and headphone amplifier mounted under the left side.',
    href: 'https://amzn.to/4qGc3DF',
  },
  {
    id: 'oeveo-under-mount-139',
    name: 'Oeveo Under Mount 139',
    description: 'Used twice beneath the desk, mounting the Fosi K7 and CalDigit TS4.',
    href: 'https://amzn.to/4gsmp5f',
  },
  {
    id: 'caldigit-ts4',
    name: 'CalDigit TS4',
    description: 'The Thunderbolt dock mounted under the right side.',
    href: 'https://amzn.to/4gsmAgV',
  },
  {
    id: 'tidbyt-v2',
    name: 'Tidbyt Gen 2',
    description: 'The small pixel display keeping time on the desk.',
    href: 'https://tidbyt.com/products/tidbyt-gen-2',
  },
  {
    id: 'zsa-voyager',
    name: 'ZSA Voyager',
    description: 'The split keyboard also in rotation.',
    href: 'https://www.zsa.io/voyager',
  },
]
