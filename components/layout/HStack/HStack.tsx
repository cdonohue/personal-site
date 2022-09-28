import React from 'react'

import Flex from '../Flex'
import { type LayoutComponentProps } from '../types'

const flexAlignLookup = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
}

type VerticalAlignment = keyof typeof flexAlignLookup
type Props = LayoutComponentProps & {
  alignment?: VerticalAlignment
  gap?: string
}

const HStack = React.forwardRef(
  ({ children, gap, alignment = 'center', ...props }: Props, ref) => {
    return (
      <Flex
        ref={ref}
        direction="row"
        gap={gap}
        align={flexAlignLookup[alignment]}
        {...props}
      >
        {children}
      </Flex>
    )
  }
)

export default HStack
