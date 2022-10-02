import * as Icons from '@radix-ui/react-icons'
import Link from 'next/link'
import Icon from '../Icon'
import Cluster from '../layout/Cluster'
import Flex from '../layout/Flex'
import HStack from '../layout/HStack'
import Spacer from '../layout/Spacer'

import styles from './Navigation.module.css'

const navigationLinks = [
  { href: '/experience', label: 'Experience' },
  // { href: '/uses', label: 'Uses' },
]

const Navigation = () => {
  return (
    <Cluster as="nav" className={styles.nav} gap="var(--size-fluid-1)">
      <Link href="/">
        <HStack as="a" gap="var(--size-2)">
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
      </Link>
      <Spacer />
      {navigationLinks.map((link) => (
        <Link key={link.href} href={link.href} className={styles.navLink}>
          <a>{link.label}</a>
        </Link>
      ))}
    </Cluster>
  )
}

export default Navigation
