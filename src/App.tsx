import DeskScene from './components/DeskScene'
import SiteHeader from './components/SiteHeader'

export default function App() {
  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-12">
      <SiteHeader />

      <DeskScene />

      {/*
       * Deliberately thin. The scene above already shows the kind of thing I
       * make, and the full history is one click away on Experience — so this
       * only has to say what I do and where, then get out of the way.
       */}
      <section className="mb-16">
        <div className="space-y-6 leading-relaxed">
          <p>
            I build web experiences at <a href="https://ramp.com">Ramp</a>. Most of my work sits
            where design and engineering meet: design systems, frontend architecture, and the shared
            pieces other teams build on top of.
          </p>
          <p>
            AI agents and workflows have changed how I work, and I enjoy finding new ways to fold
            them into how I make things.
          </p>
        </div>
      </section>
    </div>
  )
}
