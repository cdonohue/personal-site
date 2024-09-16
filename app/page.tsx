'use client'

import Image from 'next/image'
import Link from 'next/link'
import JobHistory from './components/job-history'
import { history } from './experience/work-history'
import { motion } from 'framer-motion'
import Hero from './components/hero'
import Typewriter from 'typewriter-effect'
import JobCard from './components/job-card'
import { Stack, Alignment, Row, Wrapper } from './components/layout'

export default function Home() {
  return (
    <Stack gap="m">
      <Hero backgroundKeyword="home">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Hi, I&apos;m Chad.
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          I&apos;m a software engineer.
        </motion.h2>
      </Hero>
      <Wrapper>
        <Stack gap="m">
          <Stack gap="xs">
            <h3>I Craft Digital Experiences</h3>
            <p>
              As a software engineer with a strong focus on design, I specialize
              in creating user-centric solutions that bridge the gap between
              complex technology and human needs. My role as a design engineer
              allows me to craft intuitive digital experiences that make
              technology accessible and enjoyable for everyone.
            </p>
            <p>
              In my work, I go beyond writing code. I dive deep into
              understanding user needs, developing interfaces and systems that
              feel natural and work seamlessly. This approach involves careful
              consideration of both the technical architecture and the user
              experience, ensuring that every feature not only functions
              flawlessly but also enhances the overall user journey.
            </p>
          </Stack>
          <Stack gap="xs">
            <h3>I Empower Tech Teams</h3>
            <p>
              Leading engineering teams is another key aspect of my role.
              I&apos;ve developed a leadership style that fosters collaboration
              and innovation within technical projects. By creating an
              environment where diverse perspectives are valued and open
              communication is encouraged, I help our teams not only deliver
              outstanding software but also grow professionally.
            </p>
            <p>
              At the core of my work is the belief that great software should
              make a positive impact on people&apos;s lives. Whether I&apos;m
              developing a new application or improving an existing system, my
              goal is to create digital solutions that are not just functional,
              but truly beneficial to users. It&apos;s about leveraging my
              software engineering skills to serve human needs, making every
              digital interaction as intuitive and satisfying as possible.
            </p>
          </Stack>
        </Stack>
      </Wrapper>
    </Stack>
  )
}
