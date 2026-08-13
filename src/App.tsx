import { Link } from 'react-router-dom'
import DeskScene from './components/DeskScene'

export default function App() {
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
          <h1 className="font-semibold mb-8 lg:mb-0">Chad Donohue</h1>
          <nav className="flex gap-8">
            <Link to="/" className="text-ink">
              Home
            </Link>
            <Link to="/experience" className="text-muted">
              Experience
            </Link>
            <Link to="/uses" className="text-muted">
              Uses
            </Link>
          </nav>
        </header>

        <DeskScene />

        {/* Hero */}
        <section className="mb-16">
          <div className="space-y-6 leading-relaxed">
            <p>
              I'm Chad, a Software Engineer with 17 years of experience leading cross-functional
              teams and creating innovative, user-centric software solutions. I specialize in
              frontend architecture and design systems with a consistent focus on business impact
              and developer productivity.
            </p>
            <p>
              I'm currently at{' '}
              <a href="https://ramp.com" className="text-accent underline">
                Ramp
              </a>
              , working on the Vendor Management experience and experimenting with AI-assisted
              development workflows. Before that I was at{' '}
              <a href="https://droplet.io" className="text-accent underline">
                Droplet
              </a>
              , where I led architecture and feature planning for a form builder and PDF annotation
              platform, delivered an MVP in 2 months that drove new customer acquisition, and built
              their in-house design system.
            </p>
            <p>
              Previously, I worked at{' '}
              <a href="https://webflow.com" className="text-accent underline">
                Webflow
              </a>{' '}
              helping to democratize software development and built recommendation engines at{' '}
              <a href="https://sleepdoctor.com" className="text-accent underline">
                Sleep Doctor
              </a>
              . I've consistently bridged design and engineering disciplines, established design
              systems across multiple organizations, and mentored engineers through both formal and
              informal leadership roles.
            </p>
          </div>
        </section>
      </div>

      {/* Elsewhere Footer */}
      <footer className="bg-sunken mt-auto">
        <div className="max-w-3xl w-full mx-auto px-6 py-12">
          <h3 className="text-muted mb-8">Elsewhere</h3>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {links.map((link, index) => (
              <a key={index} href={link.href} className="">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
