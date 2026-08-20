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

        {/*
         * Company and date share one muted line under the title.
         *
         * The date used to be pushed to the far right of the title's row, which
         * left a lane of dead space across every entry and split two facts that
         * belong together. The company then sat alone on the next line as a
         * fragment. This says the same thing in a third of the height.
         *
         * The company is a detail of the role rather than a heading under it:
         * as an h4 it implied the description belonged to the company.
         */}
        <div className="space-y-10">
          {jobs.map((job) => (
            <article key={`${job.company}-${job.date}`} className="space-y-1">
              <h3 data-role="item-title">{job.title}</h3>
              <p data-role="item-meta" className="text-muted">
                {job.company} · {job.date}
              </p>
              <p className="pt-2 leading-relaxed">{job.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
