import Link from 'next/link'
import { useRouter } from 'next/router'

import styles from './NavLink.module.css'

type Props = {
  href: string
  exact?: boolean
  children: React.ReactNode
  className?: string
}

const NavLink = ({
  href,
  exact = false,
  children,
  className = '',
  ...props
}: Props) => {
  const { pathname } = useRouter()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  if (isActive) {
    className = `${className} ${styles.activeLink}`.trim()
  }

  return (
    <Link href={href}>
      <a {...props} className={className}>
        {children}
      </a>
    </Link>
  )
}

export default NavLink
