import { Link } from 'react-router-dom'

export default function App() {
  const projects = [
    {
      title: 'Layered Design System',
      description: 'A comprehensive design system architecture with design tokens, headless primitives, styled UI components, and business components. Built to improve engineering velocity and enable AI-assisted code generation.',
    },
    {
      title: 'Better Deployment Scripts',
      description: 'AI-powered automation agents for release management and deployment workflows. Streamlines processes, reduces manual errors, and improves deployment frequency.',
    },
  ]

  const links = [
    { label: 'X', href: 'https://twitter.com/chaddonohue' },
    { label: 'GitHub', href: 'https://github.com/cdonohue' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/cdonohue' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-3xl w-full mx-auto px-6 py-12 flex-grow">
        {/* Header */}
        <header className="mb-16 lg:flex lg:justify-between lg:items-start">
          <h1 className="text-5xl font-light mb-8 lg:mb-0">Chad Donohue</h1>
          <nav className="flex gap-8 text-sm">
            <Link to="/" className="text-gray-900">Home</Link>
            <Link to="/experience" className="text-gray-400">Experience</Link>
            <Link to="/uses" className="text-gray-400">Uses</Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="mb-16">
          <h2 className="text-3xl font-normal mb-8 leading-tight">
           Design Engineer
          </h2>

          <div className="space-y-6 text-base leading-relaxed">
            <p>
              I'm Chad, a Software Engineer with 17 years of experience leading cross-functional teams and creating innovative, user-centric software solutions. I specialize in frontend architecture and design systems with a consistent focus on business impact and developer productivity.
            </p>
            <p>
              I'm currently at <a href="https://droplet.io" className="underline">Droplet</a>, building document workflow solutions. I lead architecture and feature planning for our form builder and PDF annotation platform, recently delivering an MVP in 2 months that drove new customer acquisition. I've also built our comprehensive in-house design system and integrated AI-enhanced development workflows that significantly improved team productivity.
            </p>
            <p>
              Previously, I worked at <a href="https://webflow.com" className="underline">Webflow</a> helping to democratize software development and built recommendation engines at <a href="https://sleepdoctor.com" className="underline">Sleep Doctor</a>. I've consistently bridged design and engineering disciplines, established design systems across multiple organizations, and mentored engineers through both formal and informal leadership roles.
            </p>
          </div>
        </section>

        {/* Projects */}
        <section className="mb-16">
          <h3 className="text-sm text-gray-400 mb-8">Projects</h3>
          <div className="space-y-8">
            {projects.map((project, index) => (
              <div key={index}>
                <h4 className="text-lg font-medium mb-2">{project.title}</h4>
                <p className="text-gray-600 leading-relaxed">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Elsewhere Footer */}
      <footer className="bg-gray-100 mt-auto">
        <div className="max-w-3xl w-full mx-auto px-6 py-12">
          <h3 className="text-sm text-gray-400 mb-8">Elsewhere</h3>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-base"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
