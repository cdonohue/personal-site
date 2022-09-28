import React from 'react'
import { type LayoutComponentProps } from '../types'

import Box from '../Box'
import styles from './Container.module.css'

type Props = LayoutComponentProps & {
  max?: string
  gutter?: string
}

const Container = React.forwardRef(
  (
    {
      max = '72ch',
      gutter = '0',
      children,
      className = '',
      style,
      ...props
    }: Props,
    ref
  ) => {
    const forwardedProps = {
      ...props,
      className: `${styles.container} ${className}`.trim(),
      style: {
        ...style,
        '--container-max-width': max,
        '--container-gutter': gutter,
      },
    }

    return (
      <Box ref={ref} {...forwardedProps}>
        {children}
      </Box>
    )
  }
)

export default Container
