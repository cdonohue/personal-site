import { history } from '@/app/experience/work-history'
import styles from './job-history.module.css'

export default function JobHistory() {
  return (
    <ol className="flex flex-col border-l-4">
      {history.map((job, index) => (
        <li key={index} className={styles.jobItem}>
          <h3>{job.company}</h3>
          <p className="text-neutral-11">{job.title}</p>
          <p className=" text-neutral-11">{`${job.startDate} - ${
            job.endDate || 'Present'
          }`}</p>
        </li>
      ))}
    </ol>
  )
}
