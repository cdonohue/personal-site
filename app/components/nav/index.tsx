import Link from 'next/link'
import styles from './nav.module.css'
import { Stack, Wrapper } from '../layout'

const navItems = [
  { href: '/about', label: 'About' },
  { href: '/work', label: 'Work' },
  { href: '/uses', label: 'Uses' },
]

export default function Nav() {
  return (
    <Stack className={`${styles.container}`}>
      <Wrapper>
        <nav className={`${styles.nav}`}>
          <Link href="/" className={`${styles.homeLink}`}>
            CD
          </Link>
          <div className="cluster gutter-s">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </Wrapper>
    </Stack>
  )
}
