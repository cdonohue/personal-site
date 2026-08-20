import { Link, NavLink } from 'react-router-dom'
import { navigation, siteName } from '../content'

/**
 * The masthead, shared by every page.
 *
 * It was copied into all three before this, which meant the active nav item was
 * hardcoded per page — each one carried its own text-ink/text-muted pair, and
 * adding a route meant editing three files and remembering to flip the colours
 * in each. NavLink derives that from the current route instead.
 */
export default function SiteHeader() {
  return (
    <header className="mb-16 lg:flex lg:justify-between lg:items-start">
      <h1 data-role="site-name" className="mb-8 lg:mb-0">
        <Link to="/" className="no-underline">
          {siteName}
        </Link>
      </h1>
      <nav className="flex gap-8">
        {navigation.map(({ label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? 'text-ink' : 'text-muted')}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
