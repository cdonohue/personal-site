import React from 'react'

import styles from './Spacer.module.css'
import Box from '../Box'

const Spacer = React.forwardRef(({ children, className, ...props }, ref) => {
  const forwardedProps = {
    ...props,
    className: `${styles.spacer} ${className}`.trim(),
  }
  return <Box {...forwardedProps}>{children}</Box>
})

export default Spacer
