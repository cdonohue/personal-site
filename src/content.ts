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
  date: string
  description: string
}

export type ToolCategory = {
  title: string
  items: { name: string; description: string }[]
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
  // Uses is pulled from the nav for now. The route and the page still exist, so
  // /uses resolves for anyone holding the link; it is just not advertised.
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
    date: 'April 2026 - Present',
    description:
      'Tooling for managing vendors and spend, and the agentic experiences built on top of it.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Droplet',
    date: 'March 2024 - April 2026',
    description:
      'Document workflow and PDF annotation tools for K-12 schools, and the design system underneath them.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Sleep Doctor',
    date: 'April 2023 - March 2024',
    description: 'Customer data platform and product recommendation engine serving 6M+ users.',
  },
  {
    title: 'Senior Software Engineer / Tech Lead',
    company: 'Webflow',
    date: 'November 2019 - April 2023',
    description:
      'Authentication and content scoping enabling visual designers to build membership sites.',
  },
  {
    title: 'Senior Software Engineer',
    company: 'Red Ventures',
    date: 'November 2015 - November 2019',
    description:
      'Embeddable widget platform with dynamic theming, running across hundreds of domains.',
  },
  {
    title: 'Software Engineer',
    company: 'Apex Capital Corp',
    date: 'October 2008 - October 2015',
    description:
      'Load board marketplace and credit check systems, and the design standards behind them.',
  },
]

export const toolCategories: ToolCategory[] = [
  {
    title: 'Development',
    items: [
      { name: 'VS Code', description: 'Primary code editor with vim keybindings' },
      { name: 'iTerm2', description: 'Terminal emulator with tmux for session management' },
      { name: 'Chrome DevTools', description: 'For debugging and performance profiling' },
    ],
  },
  {
    title: 'Design',
    items: [
      { name: 'Figma', description: 'Design tool for UI/UX work and design systems' },
      { name: 'Linear', description: 'Issue tracking and project management' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { name: 'Notion', description: 'Notes, documentation, and knowledge management' },
      { name: 'Raycast', description: 'Launcher and productivity tool' },
      { name: 'Arc', description: 'Browser for daily browsing and research' },
    ],
  },
]
