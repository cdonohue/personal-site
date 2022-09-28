import React from 'react'

import { type LayoutComponentProps } from '../types'

const Box = React.forwardRef(
  ({ as: Tag = 'div', children, ...props }: LayoutComponentProps, ref) => {
    return (
      <Tag {...props} ref={ref}>
        {children}
      </Tag>
    )
  }
)

export default Box
