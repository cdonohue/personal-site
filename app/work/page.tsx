'use client'

import { Stack, Row, Wrapper } from '@/app/components/layout'
import { history } from '../experience/work-history'
import JobCard from '../components/job-card'
import { motion } from 'framer-motion'
import Hero from '../components/hero'

// get total years of experience from history rounded down to the closest whole number
const totalExperienceInYears = Math.floor(
  history.reduce((total, job) => {
    const startDate = new Date(job.startDate)
    const endDate = job.endDate ? new Date(job.endDate) : new Date()
    const years = endDate.getFullYear() - startDate.getFullYear()
    const months = endDate.getMonth() - startDate.getMonth()

    total += years + months / 12

    return total
  }, 0)
)

export default function Work() {
  return (
    <Stack gap="m">
      <Hero backgroundKeyword="work">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          My work
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          I’ve had the pleasure of working with some amazing teams and companies
          over the past {totalExperienceInYears} years.
        </motion.p>
      </Hero>
      <Wrapper>
        <Stack gap="s" className="w-[100%]">
          <Stack gap="s" className="pb-l">
            {history.map((job, index) => (
              <div key={index}>
                <JobCard key={index} job={job} />
              </div>
            ))}
          </Stack>
        </Stack>
      </Wrapper>
    </Stack>
  )
}
