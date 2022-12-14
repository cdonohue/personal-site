import HStack from '../layout/HStack'
import VStack from '../layout/VStack'
import styles from './ExperienceCard.module.css'
import { dateDifference, dateFormat } from '../../lib/dateHelpers'
import * as Icons from '@radix-ui/react-icons'
import Icon from '../Icon'

const ExperienceCard = ({ experience, index }) => {
  return (
    <VStack
      className={styles.experienceCard}
      gap="var(--size-fluid-1)"
      alignment="stretch"
      style={{
        opacity: 0,
        animation:
          'var(--animation-fade-in) forwards, slide-in 0.2s var(--ease-squish-1)',
        animationDelay: `${index * 0.15}s`,
      }}
    >
      <HStack gap="var(--size-4)" className={styles.company}>
        <span>{experience.company}</span>
        <a
          target="_blank"
          href={experience.website}
          className={styles.companyWebsiteLink}
        >
          Visit Site
        </a>
      </HStack>
      <p className={styles.title}>{experience.title}</p>
      <HStack gap="var(--size-2)" className={styles.tenure}>
        <div className={styles.calendarIcon}>
          <Icons.CalendarIcon />
        </div>
        <span>
          {dateFormat(experience.startDate)} -{' '}
          {experience.endDate ? dateFormat(experience.endDate) : 'present'}{' '}
        </span>
        <span className={styles.tenureLength}>
          ({dateDifference(experience.endDate, experience.startDate)})
        </span>
      </HStack>

      <div
        className={styles.summary}
        dangerouslySetInnerHTML={{ __html: experience.content }}
      />
    </VStack>
  )
}

export default ExperienceCard
