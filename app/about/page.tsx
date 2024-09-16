'use client'

import { Stack, Row, Wrapper } from '@/app/components/layout'
import { history } from '../experience/work-history'
import JobCard from '../components/job-card'
import { motion } from 'framer-motion'
import Hero from '../components/hero'

export default function About() {
  return (
    <Stack gap="m">
      <Hero backgroundKeyword="about">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          About me
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          I live in the Houston area with my wife and three kids. When I&apos;m
          not at a computer, you can find me playing the piano, reading, or
          spending time with my family.
        </motion.p>
      </Hero>
      <Wrapper>
        <Stack gap="m">
          <Stack gap="xs">
            <h3>Musical Foundation</h3>
            <p>
              Music has been a cornerstone of my life since childhood, long
              before I ventured into the realm of technology. My background as a
              musician instilled valuable skills in creativity, discipline, and
              collaboration that have proven instrumental in my current role as
              a software engineer.
            </p>
            <p>
              The lessons learned from music - the importance of consistent
              practice, patience, and teamwork - laid a strong foundation for my
              transition into tech. These experiences continue to influence my
              approach to problem-solving and creativity in the digital world.
            </p>
          </Stack>
          <Stack gap="xs">
            <h3>Shift towards Technology</h3>
            <p>
              The problem-solving skills and artistic sensibilities I learned as
              a musician translated seamlessly into software and design
              engineering. This unique background allows me to approach user
              experience creation with a distinctive blend of creativity and
              technical acumen.
            </p>
            <p>
              As a software engineer, I leverage this diverse experience to
              tackle challenges from multiple angles. I find immense
              satisfaction in crafting innovative, user-centric solutions that
              resonate with people. My goal is to create digital experiences
              that are not only functional but also intuitive and engaging.
            </p>
          </Stack>
          <Stack gap="xs">
            <h3>Harmony of Art and Logic</h3>
            <p>
              My path from music to technology has given me a unique
              perspective. I combine creative thinking with technical skills to
              solve problems in new ways. This approach allows me to develop
              software that is both innovative and meaningful to users.
              Ultimately, my goal is to create digital tools that people find
              genuinely helpful and easy to use.
            </p>
          </Stack>
        </Stack>
      </Wrapper>
    </Stack>
  )
}
