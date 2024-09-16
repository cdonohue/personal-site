import { Github, Linkedin, Twitter } from 'lucide-react'
import styles from './footer.module.css'
import { Row, Spacer } from '../layout'
import { SocialIcon } from 'react-social-icons'

const socials = [
  'https://www.github.com/cdonohue',
  'https://www.linkedin.com/in/chaddonohue',
  'https://www.x.com/chaddonohue',
]

function Footer() {
  return (
    <footer className={`${styles.footer} wrapper`}>
      <Row align="center">
        <span className="text-step-00">
          © {new Date().getFullYear()} Chad Donohue
        </span>
        <Spacer />
        <Row gap="2xs">
          {socials.map((url) => (
            <SocialIcon
              key={url}
              url={url}
              target="_blank"
              rel="noopener noreferrer"
              bgColor="var(--color-neutral-3)"
              fgColor="var(--color-neutral-11)"
              style={{ height: 'var(--space-m)', width: 'var(--space-m)' }}
            />
          ))}
        </Row>
      </Row>
    </footer>
  )
}

export default Footer
