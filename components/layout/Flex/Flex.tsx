import React from 'react'

import styles from './Flex.module.css'
import Box from '../Box'

export type Alignment = 'start' | 'end' | 'center' | 'stretch' | 'baseline'
type Direction = 'column' | 'row'
export type Justification =
  | 'start'
  | 'end'
  | 'center'
  | 'space-around'
  | 'space-between'

const Flex = React.forwardRef(
  (
    {
      align = 'stretch',
      direction = 'row',
      justify = 'start',
      children,
      className = '',
      style,
      gap = '0',
      wrap = false,
      inline = false,
      ...props
    },
    ref
  ) => {
    const forwardedProps = {
      ...props,
      className: `${styles.flex} ${className}`.trim(),
      style: {
        ...style,
        '--flex-align': align,
        '--flex-direction': direction,
        '--flex-justify': justify,
        '--flex-wrap': wrap ? 'wrap' : 'nowrap',
        '--flex-display': inline ? 'inline-flex' : 'flex',
        '--flex-gap': gap,
      },
    }

    return (
      <Box ref={ref} {...forwardedProps}>
        {children}
      </Box>
    )
  }
)

export default Flex
