import React from 'react'
import Flex from '../layout/Flex'
import styles from './Icon.module.css'

// type Props = {
//   variant: keyof allIcons
// }

const Icon = ({ variant: Variant, label = '', gap = '0', ...props }) => {
  return (
    // @ts-ignore
    <Flex
      data-layout-icon
      gap={gap}
      align="baseline"
      inline={true}
      className={styles.icon}
      ariaLabel={label}
      {...props}
    >
      <Variant />
      {label}
    </Flex>
  )
}

export default Icon
