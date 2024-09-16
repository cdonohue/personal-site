import { Stack, Wrapper } from '../layout'
import styles from './hero.module.css'

type HeroProps = {
  children: React.ReactNode
  py?: string
}

export default function Hero({
  children,
  py = 'xl',
  backgroundKeyword = 'subtle',
}: HeroProps & { backgroundKeyword?: string }) {
  return (
    <header
      style={
        {
          '--bg-image-small': `url(/images/${backgroundKeyword}-small.jpg)`,
          '--bg-image-medium': `url(/images/${backgroundKeyword}-medium.jpg)`,
          '--bg-image-large': `url(/images/${backgroundKeyword}-large.jpg)`,
        } as React.CSSProperties
      }
      className={`${styles.hero} py-${py}`}
    >
      <Wrapper>
        <Stack gap="s">{children}</Stack>
      </Wrapper>
    </header>
  )
}
