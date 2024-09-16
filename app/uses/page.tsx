'use client'

import { Stack, Grid, Wrapper, Row, Spacer } from '../components/layout'
import { things } from './recommendations'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { shadows } from '../design-tokens'
import Hero from '../components/hero'
import { ArrowRight, ArrowUpRight, ShoppingCart } from 'lucide-react'

const categories = Array.from(new Set(things.map((thing) => thing.category)))

export default function Uses() {
  return (
    <Stack gap="m">
      <Hero backgroundKeyword="uses">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Uses
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Here are some of the things that I use on a daily basis to work,
          learn, and have fun.
        </motion.p>
      </Hero>
      <Wrapper>
        <Stack gap="m">
          <div className="p-xs py-zero border-l-4 border-neutral-6">
            <p className="text-step-00">
              Some of the links below are affiliate links, meaning I may earn a
              commission if you make a purchase through them. I only recommend
              products and services I use and believe in. Thank you for any
              support!
            </p>
          </div>
          <Stack gap="l">
            {categories.map((category, index) => (
              <Stack key={category} gap="s">
                <h3>{category}</h3>
                <Grid gap="m">
                  {things
                    .filter((thing) => thing.category === category)
                    .map((thing, index) => (
                      <Card key={index} thing={thing} />
                    ))}
                </Grid>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Wrapper>
    </Stack>
  )
}

function Card({ thing }) {
  return (
    <motion.a
      className="rounded-sm"
      target="_blank"
      rel="noreferrer noopener"
      href={thing.link}
      whileHover="hover"
      transition={{ duration: 0.1 }}
    >
      <Stack gap="xs">
        <motion.div
          variants={{
            hover: {
              translateY: -5,
              backgroundColor: 'var(--color-neutral-5)',
            },
          }}
          transition={{ duration: 0.1 }}
          className="flex items-center rounded-md gap-s h-3xl p-xs bg-neutral-3
      max-w-[100%]"
        >
          {thing.icon && <thing.icon />}
        </motion.div>
        <Stack gap="2xs">
          <Row align="center">
            <h5>{thing.title}</h5>
            <Spacer />
            <motion.div
              className="text-neutral-10"
              initial={{ opacity: 0, translateX: -5 }}
              variants={{
                hover: { opacity: 1, translateX: 0, className: 'shadow-l' },
              }}
              transition={{ duration: 0.15 }}
            >
              <ArrowUpRight />
            </motion.div>
          </Row>
          <p className="text-step-00">{thing.description}</p>
        </Stack>
      </Stack>
    </motion.a>
  )
}
