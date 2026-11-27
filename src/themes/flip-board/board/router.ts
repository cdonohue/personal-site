/**
 * Page changes without a page load, so the board survives them.
 *
 * Every page is still a real HTML file: this fetches the next one, takes its
 * source content and its head, and swaps them into the current document. The
 * board then diffs the new source against what it is showing and turns only
 * the flaps that differ. A full load would rebuild the board from blank and
 * every cell would run, which is the opposite of the effect.
 *
 * Anything that is not another board page — the project explorers, which are
 * in their own design, or an external site — gets an ordinary navigation.
 */

const SOURCE = '[data-flip-source]'

const cache = new Map<string, Promise<Document | null>>()

const load = (url: string) => {
  let page = cache.get(url)
  if (!page) {
    page = fetch(url, { headers: { accept: 'text/html' } })
      .then(async (res) => {
        if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) return null
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
        return doc.querySelector(SOURCE) ? doc : null
      })
      .catch(() => null)
    cache.set(url, page)
    // A failure should not stick: the next attempt is a real navigation anyway.
    void page.then((doc) => doc || cache.delete(url))
  }
  return page
}

/** Same-origin, same-tab, left-click, and not a project explorer. */
const candidate = (event: MouseEvent): HTMLAnchorElement | null => {
  if (event.defaultPrevented || event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  const a = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return null
  const url = new URL(a.href, location.href)
  if (url.origin !== location.origin) return null
  if (/^\/projects\/[^/]+/.test(url.pathname)) return null
  return a
}

const key = (url: URL) => url.pathname + url.search

const swap = (doc: Document) => {
  document.title = doc.title
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')
  if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  const next = doc.querySelector(SOURCE)!
  const current = document.querySelector(SOURCE)!
  current.replaceChildren(...[...next.childNodes].map((node) => document.importNode(node, true)))
}

export const startRouter = (onNavigate: () => void) => {
  const go = async (url: URL, push: boolean) => {
    const doc = await load(key(url))
    if (!doc) {
      location.assign(url)
      return
    }
    if (push) history.pushState({}, '', url)
    scrollTo({ top: 0 })
    swap(doc)
    onNavigate()
  }

  document.addEventListener('click', (event) => {
    const a = candidate(event)
    if (!a) return
    const url = new URL(a.href)
    if (key(url) === key(new URL(location.href)) && url.hash) return
    event.preventDefault()
    void go(url, key(url) !== key(new URL(location.href)))
  })

  // Warm the next page while the pointer is still on its way to the click.
  document.addEventListener('pointerover', (event) => {
    const a = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!a) return
    const url = new URL(a.href, location.href)
    if (url.origin === location.origin && !/^\/projects\/[^/]+/.test(url.pathname)) void load(key(url))
  })

  window.addEventListener('popstate', () => void go(new URL(location.href), false))
}
