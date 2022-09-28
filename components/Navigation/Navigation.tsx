import Link from 'next/link'
import HStack from '../layout/HStack'
import Spacer from '../layout/Spacer'

import styles from './Navigation.module.css'

const navigationLinks = [
  { href: '/experience', label: 'Experience' },
  // { href: '/uses', label: 'Uses' },
]

const Navigation = () => {
  return (
    <HStack className={styles.nav}>
      <Link href="/" passHref>
        <HStack
          gap="var(--size-2)"
          alignment="center"
          className={styles.navLink}
        >
          <img
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '9999px',
              boxShadow: 'var(--shadow-2)',
            }}
            src="/assets/avatar-pic.jpg"
          />
          <span>Chad Donohue</span>
        </HStack>
      </Link>
      <Spacer />
      <HStack gap="1rem">
        {navigationLinks.map((link) => (
          <Link key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
            {/* <Icon variant={link.icon} label={link.label} /> */}
          </Link>
        ))}
      </HStack>
    </HStack>
  )
}

export default Navigation
