import {
  GitHubLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons'
import HStack from '../layout/HStack'
import styles from './Button.module.css'

const Button = ({ variant, url = '', children }) => {
  const tagName = url ? 'a' : 'button'
  return (
    <HStack
      className={`${styles.button} ${styles[variant]}`}
      gap="var(--size-1)"
      as={tagName}
    >
      {children}
    </HStack>
  )
}

export default Button
