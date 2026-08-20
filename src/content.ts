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
    date: 'April 2026 - Present',
    description:
      'Improving the Vendor Management experience. Experimenting with AI-assisted development workflows and how they change the way a team builds software.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Droplet',
    date: 'March 2024 - April 2026',
    description:
      'Leading technical architecture and feature planning for document workflow solutions serving K-12 schools. Built comprehensive 4-layer design system and integrated AI-enhanced development workflows. Delivered PDF annotation MVP in 2 months, driving new customer acquisition.',
  },
  {
    title: 'Staff Software Engineer',
    company: 'Sleep Doctor',
    date: 'April 2023 - March 2024',
    description:
      'Developed customer data platform and dynamic product recommendation engine serving 6M+ users. Integrated LLM-powered review analysis for automated product recommendations. Led strategic technical decisions at executive level.',
  },
  {
    title: 'Senior Software Engineer / Tech Lead',
    company: 'Webflow',
    date: 'November 2019 - April 2023',
    description:
      'Founded User Systems pod focused on no-code authentication flows. Built authentication and content scoping features enabling subscription/membership sites. Established formal mentoring program with structured 1:1s for junior engineers.',
  },
  {
    title: 'Senior Software Engineer',
    company: 'Higher Education',
    date: 'November 2015 - November 2019',
    description:
      'Built embeddable widget platform with dynamic theming across hundreds of domains. Developed server-side analytics layer for performance-constrained environments. Created multi-tenant architecture for scalable partner integrations.',
  },
  {
    title: 'Software Engineer',
    company: 'Apex Capital Corp',
    date: 'October 2008 - October 2015',
    description:
      'Founded frontend engineering team, growing engineering from 4 to 20 people. Built credit check system integration and load board marketplace platform. Introduced design systems and consistency standards across internal and external applications.',
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
