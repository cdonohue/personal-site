import { Link } from 'react-router-dom'

export default function Uses() {
  const categories = [
    {
      title: 'Development',
      items: [
        { name: 'VS Code', description: 'Primary code editor with vim keybindings' },
        { name: 'iTerm2', description: 'Terminal emulator with tmux for session management' },
        { name: 'Chrome DevTools', description: 'For debugging and performance profiling' },
      ],
    },
    {
      title: 'Design',
      items: [
        { name: 'Figma', description: 'Design tool for UI/UX work and design systems' },
        { name: 'Linear', description: 'Issue tracking and project management' },
      ],
    },
    {
      title: 'Productivity',
      items: [
        { name: 'Notion', description: 'Notes, documentation, and knowledge management' },
        { name: 'Raycast', description: 'Launcher and productivity tool' },
        { name: 'Arc', description: 'Browser for daily browsing and research' },
      ],
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
          <h1 className="text-5xl font-light mb-8 lg:mb-0">
            <Link to="/" className="no-underline">Chad Donohue</Link>
          </h1>
          <nav className="flex gap-8 text-sm">
            <Link to="/" className="text-gray-400">Home</Link>
            <Link to="/experience" className="text-gray-400">Experience</Link>
            <Link to="/uses" className="text-gray-900">Uses</Link>
          </nav>
        </header>

        {/* Uses Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-normal mb-12 leading-tight">
            Tools & Software
          </h2>

          <div className="space-y-12">
            {categories.map((category, index) => (
              <div key={index}>
                <h3 className="text-sm text-gray-400 mb-6">{category.title}</h3>
                <div className="space-y-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h4 className="text-lg font-medium mb-1">{item.name}</h4>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
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
