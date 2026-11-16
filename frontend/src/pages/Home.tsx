import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../api'
import Icon from '../components/Icon'
import { platformIcon } from '../components/platformIcon'
import ProductCard from '../components/ProductCard'
import Status from '../components/Status'
import type { Banner, Filters, Product } from '../types'
import { useColumns } from '../useColumns'

// Each block fetches its own endpoint; the page only displays what comes back.

const Banners = () => {
  const { data, loading, error } = useFetch<{ data: Banner[] }>('/home/banners')
  return (
    <section className="banners">
      <Status loading={loading} error={error} />
      {data?.data.map((b) => (
        <Link
          key={b.id}
          to={b.link}
          className="banner"
          style={{ background: `linear-gradient(120deg, ${b.color}, #12082b)` }}
        >
          <h2>{b.title}</h2>
          {b.subtitle && <p>{b.subtitle}</p>}
        </Link>
      ))}
    </section>
  )
}

// Display order of the platform entries; a platform that is not listed here still shows up, after these.
const PLATFORM_ORDER = ['PlayStation', 'Xbox', 'Steam', 'Nintendo', 'Epic Games']

const byPlatformOrder = (a: string, b: string): number => {
  const rank = (p: string) =>
    PLATFORM_ORDER.includes(p) ? PLATFORM_ORDER.indexOf(p) : PLATFORM_ORDER.length
  return rank(a) - rank(b) || a.localeCompare(b)
}

/** Horizontal category strip under the hero: "Games", then one entry per platform taken from the catalog. */
const CategoryStrip = () => {
  const { data } = useFetch<Filters>('/filters')
  const items = [
    { label: 'Games', to: '/store', icon: 'grid' as const },
    ...[...(data?.platforms ?? [])].sort(byPlatformOrder).map((p) => ({
      label: p,
      to: `/store?platform=${encodeURIComponent(p)}`,
      icon: platformIcon(p),
    })),
  ]
  return (
    <nav className="category-strip" aria-label="Browse categories">
      {items.map((item) => (
        <Link key={item.label} to={item.to} className="category">
          <span className="category-icon">
            <Icon name={item.icon} />
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

const ProductBlock = ({ title, path }: { title: string; path: string }) => {
  const { data, loading, error } = useFetch<{ data: Product[] }>(path)
  const gridRef = useRef<HTMLDivElement>(null)
  // The first row shows exactly as many cards as fit across the screen (no sideways scroll bar);
  // "Show all" reveals the rest in place.
  const perRow = useColumns(gridRef)
  const [expanded, setExpanded] = useState(false)
  const products = data?.data ?? []
  const shown = expanded ? products : products.slice(0, perRow)

  return (
    <section>
      <div className="section-head section-title">
        <h2>{title}</h2>
      </div>
      <Status loading={loading} error={error} />
      <div className="grid" ref={gridRef}>
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length > perRow && (
        <div className="show-all">
          <button
            type="button"
            className="btn"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Show less' : 'Show all'}
          </button>
        </div>
      )}
    </section>
  )
}

const Genres = () => {
  const { data } = useFetch<Filters>('/filters')
  if (!data) return null
  return (
    <section>
      <div className="section-head section-title">
        <h2>Browse by genre</h2>
      </div>
      <div className="tiles">
        {data.genres.map((g) => (
          <Link key={g} to={`/store?genre=${encodeURIComponent(g)}`} className="tile">
            {g}
          </Link>
        ))}
      </div>
    </section>
  )
}

const Home = () => {
  return (
    <div className="container stack">
      <Banners />
      <CategoryStrip />
      <ProductBlock title="Best sellers" path="/home/best-sellers" />
      <ProductBlock title="Hot deals" path="/home/deals" />
      <Genres />
    </div>
  )
}

export default Home
