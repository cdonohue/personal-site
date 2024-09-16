import React, { useState } from 'react'
import styles from './job-card.module.css'
import { Stack, Row, Cluster } from '../layout'
import { Calendar, CalendarClock, Clock } from 'lucide-react'

function formatDate(
  dateStr: string | null,
  defaultDate: Date = new Date(),
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' },
  locale: string = 'en-US'
): string {
  let date: Date

  if (dateStr) {
    date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateStr}. Using default date.`)
      date = defaultDate
    }
  } else {
    date = defaultDate
  }

  return date.toLocaleDateString(locale, options)
}

function calculateTenure(
  startDateStr: string,
  endDateStr: string | null
): string {
  const startDate = new Date(startDateStr)
  const endDate = endDateStr ? new Date(endDateStr) : new Date()

  let years = endDate.getFullYear() - startDate.getFullYear()
  let months = endDate.getMonth() - startDate.getMonth()

  if (months < 0) {
    years -= 1
    months += 12
  }

  // Round up months
  if (months === 11) {
    years += 1
    months = 0
  } else if (months > 0) {
    months = Math.ceil(months)
  }

  let tenure = ''
  if (years > 0) {
    tenure += `${years} year${years > 1 ? 's' : ''}`
  }
  if (months > 0) {
    if (tenure) tenure += ' '
    tenure += `${months} month${months > 1 ? 's' : ''}`
  }

  return tenure
}

function formatDatesAndCalculateTenure(
  startDateStr: string,
  endDateStr: string | null
) {
  const formattedStartDate = formatDate(startDateStr)
  const formattedEndDate = endDateStr ? formatDate(endDateStr) : 'Present'
  const tenure = calculateTenure(startDateStr, endDateStr)

  return {
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    tenure: tenure,
  }
}

function JobCard({ job }) {
  const { startDate, endDate, tenure } = formatDatesAndCalculateTenure(
    job.startDate,
    job.endDate
  )

  return (
    <div className={styles.container}>
      <div className={styles.job}>
        <div
          className={`${styles.icon} rounded-md bg-neutral-3 text-neutral-9 p-xs`}
        >
          <job.icon />
        </div>
        <Stack className={styles.title}>
          <div className="text-step-0 text-neutral-12">{job.title}</div>
          <Cluster gap="2xs">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-step-00 font-bold text-neutral-11 underline decoration-1 decoration-neutral-9"
            >
              {job.company}
            </a>
            <Row align="center" gap="3xs">
              <Calendar size={12} className="text-neutral-9" />
              <div className="text-step-00 text-neutral-11">
                {startDate} - {endDate}
              </div>
            </Row>
            <Row align="center" gap="3xs">
              <CalendarClock size={12} className="text-neutral-9" />
              <div className="text-step-00 text-neutral-11">{tenure}</div>
            </Row>
          </Cluster>
        </Stack>
        <div className={styles.gutter} />
        <div className={styles.description}>{job.description}</div>
      </div>
    </div>
  )
}

export default JobCard
