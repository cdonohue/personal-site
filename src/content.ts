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
    description:
      'Vendor management and spend products, including agentic workflows that make complex financial operations easier to understand and act on.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Droplet',
    url: 'https://droplet.io',
    description:
      'Document workflows and PDF annotation tools for K–12 schools, supported by a design system that kept the product coherent as it grew.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Sleep Doctor',
    url: 'https://sleepdoctor.com',
    description:
      'A customer data platform and product recommendation engine powering personalized experiences for more than six million users.',
  },
  {
    title: 'Senior Software Engineer',
    company: 'Webflow',
    url: 'https://webflow.com',
    description:
      'Authentication and content-access systems that let visual designers create and run membership sites without writing code.',
  },
  {
    title: 'Senior Software Engineer',
    company: 'Red Ventures',
    url: 'https://www.redventures.com',
    description:
      'An embeddable, dynamically themed widget platform deployed across hundreds of domains.',
  },
  {
    title: 'Software Engineer',
    company: 'Apex Capital',
    url: 'https://www.apexcapitalcorp.com',
    description:
      'A load-board marketplace, credit-checking systems, and the design standards connecting a growing suite of products.',
  },
]

/** Physical hardware in the workspace. Themes decide how to group and present it. */
export const usesItems: UseItem[] = [
  {
    id: 'standing-desk-frame',
    name: 'Autonomous Desk DIY',
    description: 'The height-adjustable frame that turns the KARLBY countertop into a standing desk.',
    href: 'https://www.autonomous.ai/standing-desks/autonomous-desk-diy',
  },
  {
    id: 'desktop-surface',
    name: 'IKEA KARLBY',
    description: 'A 74-inch walnut countertop repurposed as a wide, warm desktop.',
    href: 'https://www.ikea.com/us/en/p/karlby-countertop-walnut-veneer-50335208/',
  },
  {
    id: 'macbook-pro',
    name: 'MacBook Pro',
    description: 'The computer driving the setup, docked vertically beside the desk.',
    href: 'https://www.apple.com/macbook-pro/',
  },
  {
    id: 'kuzy-laptop-vertical-stand',
    name: 'Kuzy Laptop Vertical Stand',
    description: 'Keeps the closed MacBook upright and out of the way while it is docked.',
    href: 'https://amzn.to/3SAslBc',
  },
  {
    id: 'monitor',
    name: 'Gigabyte M32U',
    description: 'The single large display at the center of the workspace.',
    href: 'https://www.gigabyte.com/Monitor/M32U',
  },
  {
    id: 'monitor-arm',
    name: 'Ergotron LX',
    description: 'Suspends the display and leaves the desk beneath it usable.',
    href: 'https://amzn.to/4cVWUbt',
  },
  {
    id: 'webcam',
    name: 'Opal C1',
    description: 'A compact webcam perched above the display for calls.',
    href: 'https://op.al/',
  },
  {
    id: 'keychron-q2-max',
    name: 'Keychron Q2 Max',
    description: 'The compact mechanical keyboard shown in the desk scene.',
    href: 'https://amzn.to/4xl8sgD',
  },
  {
    id: 'logitech-mx-master-4',
    name: 'Logitech MX Master 4',
    description: 'The everyday mouse beside the keyboard, with extra controls close at hand.',
    href: 'https://amzn.to/4xfW1Tm',
  },
  {
    id: 'microphone',
    name: 'Shure MV7',
    description: 'A dynamic microphone that swings into place for calls and recording.',
    href: 'https://amzn.to/4y2S2cU',
  },
  {
    id: 'elgato-wave-mic-arm',
    name: 'Elgato Wave Mic Arm',
    description: 'Brings the microphone into position for calls, then folds back out of the way.',
    href: 'https://amzn.to/4qAaTtr',
  },
  {
    id: 'headphones',
    name: 'beyerdynamic DT 900 PRO X',
    description: 'Open-back headphones for focused work, music, and calls.',
    href: 'https://amzn.to/4hV2Uow',
  },
  {
    id: 'audio-dac',
    name: 'Fosi Audio K7',
    description: 'The under-desk DAC and amplifier that drives the headphones.',
    href: 'https://amzn.to/4qGc3DF',
  },
  {
    id: 'oeveo-under-mount-139',
    name: 'Oeveo Under Mount 139',
    description: 'A pair of low-profile mounts: one for the Fosi K7 and one for the CalDigit TS4.',
    href: 'https://amzn.to/4gsmp5f',
  },
  {
    id: 'caldigit-ts4',
    name: 'CalDigit TS4',
    description: 'The under-desk Thunderbolt dock connecting the MacBook to the rest of the setup.',
    href: 'https://amzn.to/4gsmAgV',
  },
  {
    id: 'tidbyt-v2',
    name: 'Tidbyt Gen 2',
    description: 'A small pixel display for time, weather, and ambient information.',
    href: 'https://tidbyt.com/products/tidbyt-gen-2',
  },
  {
    id: 'zsa-voyager',
    name: 'ZSA Voyager',
    description: 'A low-profile split keyboard that trades the Q2 Max’s compact slab for two ergonomic halves.',
    href: 'https://www.zsa.io/voyager',
  },
]
