import React from 'react'

import Flex from '../Flex'
import { type LayoutComponentProps } from '../types'

const flexAlignLookup = {
  leading: 'flex-start',
  center: 'center',
  trailing: 'flex-end',
  stretch: 'stretch',
}

type HorizontalAlignment = keyof typeof flexAlignLookup
type Props = LayoutComponentProps & {
  alignment?: HorizontalAlignment
  gap?: string
}

const VStack = React.forwardRef(
  ({ children, gap, alignment = 'stretch', ...props }: Props, ref) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        gap={gap}
        align={flexAlignLookup[alignment]}
        {...props}
      >
        {children}
      </Flex>
    )
  }
)

export default VStack
