import SiteHeader from '../components/SiteHeader'
import { toolCategories } from '../content'

export default function Uses() {
  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-12">
      <SiteHeader />

      <section className="mb-16">
        <h2 data-role="page-title" className="mb-12">
          Tools &amp; Software
        </h2>

        <div className="space-y-12">
          {toolCategories.map((category) => (
            <div key={category.title}>
              <h3 data-role="section-label" className="text-muted mb-6">
                {category.title}
              </h3>
              <div className="space-y-6">
                {category.items.map((item) => (
                  <div key={item.name}>
                    <h4 data-role="item-title" className="mb-1">
                      {item.name}
                    </h4>
                    <p className="text-muted leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
