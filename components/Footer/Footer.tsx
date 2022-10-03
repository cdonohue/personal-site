import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
  EnvelopeClosedIcon,
} from '@radix-ui/react-icons'
import Icon from '../Icon'
import Container from '../layout/Container'
import HStack from '../layout/HStack'
import Spacer from '../layout/Spacer'
import VStack from '../layout/VStack'
import styles from './Footer.module.css'

const socialLinks = [
  { href: 'mailto:chad.donohue@gmail.com', icon: EnvelopeClosedIcon },
  { href: 'https://github.com/cdonohue', icon: GitHubLogoIcon },
  {
    href: 'https://www.linkedin.com/in/chaddonohue',
    icon: LinkedInLogoIcon,
  },
  { href: 'https://twitter.com/chaddonohue', icon: TwitterLogoIcon },
]

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        <VStack alignment="center" gap="var(--size-fluid-2)" className="p-4">
          <span>Copyright © 2022 Chad Donohue</span>
          <HStack gap="var(--size-fluid-1)">
            {socialLinks.map((link) => (
              <a
                data-footer-link
                target="_blank"
                href={link.href}
                className={styles.socialLink}
              >
                <link.icon />
              </a>
            ))}
          </HStack>
        </VStack>
      </Container>
    </footer>
  )
}

export default Footer
