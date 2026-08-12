import { Link } from 'react-router-dom'

export default function Experience() {
  const jobs = [
    {
      title: 'Staff Software Engineer',
      company: 'Droplet',
      date: 'March 2024 - Present',
      description: 'Leading technical architecture and feature planning for document workflow solutions serving K-12 schools. Built comprehensive 4-layer design system and integrated AI-enhanced development workflows. Delivered PDF annotation MVP in 2 months, driving new customer acquisition.',
    },
    {
      title: 'Staff Software Engineer',
      company: 'Sleep Doctor',
      date: 'April 2023 - March 2024',
      description: 'Developed customer data platform and dynamic product recommendation engine serving 6M+ users. Integrated LLM-powered review analysis for automated product recommendations. Led strategic technical decisions at executive level.',
    },
    {
      title: 'Senior Software Engineer / Tech Lead',
      company: 'Webflow',
      date: 'November 2019 - April 2023',
      description: 'Founded User Systems pod focused on no-code authentication flows. Built authentication and content scoping features enabling subscription/membership sites. Established formal mentoring program with structured 1:1s for junior engineers.',
    },
    {
      title: 'Senior Software Engineer',
      company: 'Higher Education',
      date: 'November 2015 - November 2019',
      description: 'Built embeddable widget platform with dynamic theming across hundreds of domains. Developed server-side analytics layer for performance-constrained environments. Created multi-tenant architecture for scalable partner integrations.',
    },
    {
      title: 'Software Engineer',
      company: 'Apex Capital Corp',
      date: 'October 2008 - October 2015',
      description: 'Founded frontend engineering team, growing engineering from 4 to 20 people. Built credit check system integration and load board marketplace platform. Introduced design systems and consistency standards across internal and external applications.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-3xl w-full mx-auto px-6 py-12 flex-grow">
        {/* Header */}
        <header className="mb-16 lg:flex lg:justify-between lg:items-start">
          <h1 className="text-5xl font-light mb-8 lg:mb-0">
            <Link to="/" className="no-underline">Chad Donohue</Link>
          </h1>
          <nav className="flex gap-8 text-sm">
            <Link to="/" className="text-gray-400">Home</Link>
            <Link to="/experience" className="text-gray-900">Experience</Link>
            <Link to="/uses" className="text-gray-400">Uses</Link>
          </nav>
        </header>

        {/* Experience Section */}
        <section className="mb-16">
          <div className="space-y-16">
            {jobs.map((job, index) => (
              <div key={index} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
                  <h3 className="text-lg font-medium">{job.title}</h3>
                  <span className="text-sm text-gray-400">{job.date}</span>
                </div>
                <h4 className="text-base font-normal text-gray-600">{job.company}</h4>
                <p className="text-base leading-relaxed">{job.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 mt-auto">
        <div className="max-w-3xl w-full mx-auto px-6 py-12">
          <h3 className="text-sm text-gray-400 mb-8">Elsewhere</h3>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <a href="https://twitter.com/chaddonohue" className="text-base">X</a>
            <a href="https://github.com/cdonohue" className="text-base">GitHub</a>
            <a href="https://linkedin.com/in/cdonohue" className="text-base">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
