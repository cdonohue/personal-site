import SiteHeader from '../components/SiteHeader'
import { jobs } from '../content'

export default function Experience() {
  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-12">
      <SiteHeader />

      <section className="mb-16">
        {/*
         * This page used to go straight from the site name to job titles with
         * nothing in between, so the list of roles was never announced as
         * anything. Visually quiet, structurally the thing that makes the
         * headings below a subsection rather than a second run of top-level
         * ones.
         */}
        <h2 data-role="section-label" className="text-muted mb-8">
          Experience
        </h2>

        <div className="space-y-16">
          {jobs.map((job) => (
            <article key={`${job.company}-${job.date}`} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
                <h3 data-role="item-title">{job.title}</h3>
                <p data-role="item-meta" className="text-muted">
                  {job.date}
                </p>
              </div>
              {/*
               * The company is a detail of the role, not a heading under it —
               * as an h4 it implied the description belonged to the company
               * rather than the job.
               */}
              <p data-role="item-meta" className="text-muted">
                {job.company}
              </p>
              <p className="leading-relaxed">{job.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
