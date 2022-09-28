import React from 'react'

import styles from './Spacer.module.css'
import Box from '../Box'
import { LayoutComponentProps } from '../types'

type Props = LayoutComponentProps

const Spacer = React.forwardRef(
  ({ children, className, ...props }: Props, ref) => {
    const forwardedProps = {
      ...props,
      className: `${styles.spacer} ${className}`.trim(),
    }
    return <Box {...forwardedProps}>{children}</Box>
  }
)

export default Spacer
