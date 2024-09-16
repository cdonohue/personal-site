import { ElementType } from 'react'
import styles from './wrapper.module.css'

type WrapperProps = {
  className?: string
  children: React.ReactNode
  gutter?: string
  as?: ElementType
}

function Wrapper({
  children,
  gutter = 's-l',
  className = '',
  as: Tag = 'div',
}: WrapperProps) {
  return (
    <Tag
      className={`${className} pl-${gutter} pr-${gutter} ${styles.wrapper}`.trim()}
    >
      {children}
    </Tag>
  )
}

export { Wrapper }
