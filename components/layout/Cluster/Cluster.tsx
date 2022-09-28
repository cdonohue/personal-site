import React from 'react'

import Flex from '../Flex'
import { type LayoutComponentProps } from '../types'

const flexAlignLookup = {
  leading: 'flex-start',
  center: 'center',
  trailing: 'flex-end',
}

type HorizontalAlignment = keyof typeof flexAlignLookup
type Props = LayoutComponentProps & {
  alignment?: HorizontalAlignment
  gap?: string
}

const Cluster = React.forwardRef(
  ({ children, gap, alignment = 'center', ...props }: Props, ref) => {
    return (
      <Flex
        ref={ref}
        direction="row"
        gap={gap}
        wrap={true}
        align={flexAlignLookup[alignment]}
        {...props}
      >
        {children}
      </Flex>
    )
  }
)

export default Cluster
