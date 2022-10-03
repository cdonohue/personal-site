import * as Icons from '@radix-ui/react-icons'
import Link from 'next/link'
import Icon from '../Icon'
import Cluster from '../layout/Cluster'
import Flex from '../layout/Flex'
import HStack from '../layout/HStack'
import Spacer from '../layout/Spacer'

import styles from './Navigation.module.css'
import NavLink from './NavLink'

const navigationLinks = [
  { href: '/experience', label: 'Experience' },
  // { href: '/uses', label: 'Uses' },
]

const Navigation = () => {
  return (
    <Cluster as="nav" className={styles.nav} gap="var(--size-fluid-1)">
      <NavLink href="/">
        <HStack data-nav-link gap="var(--size-2)">
          <img
            src="/assets/avatar-pic.jpg"
            style={{
              borderRadius: 'var(--radius-round)',
              boxShadow: 'var(--shadow-1)',
              width: '2rem',
            }}
          />
          Home
        </HStack>
      </NavLink>
      <Spacer />
      {navigationLinks.map((link) => (
        <NavLink key={link.href} href={link.href} className={styles.navLink}>
          {link.label}
        </NavLink>
      ))}
    </Cluster>
  )
}

export default Navigation
