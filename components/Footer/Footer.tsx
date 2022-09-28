import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons'
import Container from '../layout/Container'
import HStack from '../layout/HStack'
import Spacer from '../layout/Spacer'
import VStack from '../layout/VStack'
import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container className={styles.container}>
        <VStack alignment="center" gap="var(--size-fluid-2)" className="p-4">
          <span>Copyright © 2022 Chad Donohue</span>
          <HStack gap="var(--size-fluid-1)">
            <GitHubLogoIcon />
            <LinkedInLogoIcon />
            <TwitterLogoIcon />
            <Spacer />
          </HStack>
        </VStack>
      </Container>
    </footer>
  )
}

export default Footer
