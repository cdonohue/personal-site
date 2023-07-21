import * as React from 'react'
import { motion } from 'framer-motion'

export default function Animated({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{ duration: 0.2, delay }}
    >
      {children}
    </motion.div>
  )
}
