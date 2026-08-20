import { Link, NavLink } from 'react-router-dom'
import { navigation, siteName } from '../content'

/**
 * The masthead, shared by every page.
 *
 * It was copied into all three before this, which meant the active nav item was
 * hardcoded per page: each one carried its own text-ink/text-muted pair, and
 * adding a route meant editing three files and remembering to flip the colours
 * in each. NavLink derives that from the current route instead, and marks it
 * with aria-current, which is what the stylesheet keys off.
 *
 * The name and nav sit on a shared rule rather than floating, and align on
 * their baselines rather than by box centre: with a 38px name against a 22px
 * nav, centring the boxes leaves the nav visibly adrift, while a common
 * baseline locks both to the same line the rule draws.
 *
 * Side by side from `sm` (640px) rather than `lg`. The column stops growing at
 * 768px, so between 768 and 1024 the old breakpoint kept the header stacked
 * while the space beneath it was already at full width and unchanged. The name
 * and nav need about 448px of the 720 available, so 640 is the first standard
 * step with room to spare.
 */
export default function SiteHeader() {
  return (
    <header data-role="masthead" className="mb-12 sm:flex sm:items-baseline sm:justify-between">
      <h1 data-role="site-name" className="mb-8 sm:mb-0">
        <Link to="/">{siteName}</Link>
      </h1>
      <nav className="flex gap-8">
        {navigation.map(({ label, to, end }) => (
          <NavLink key={to} to={to} end={end}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
