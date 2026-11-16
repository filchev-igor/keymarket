import { Link } from 'react-router-dom'
import { useFetch } from '../api'
import Icon, { platformIcon } from '../components/Icon'
import ProductCard from '../components/ProductCard'
import Status from '../components/Status'
import type { Banner, Filters, Product } from '../types'

// Each block fetches its own endpoint; the page only displays what comes back.

function Banners() {
  const { data, loading, error } = useFetch<{ data: Banner[] }>('/home/banners')
  return (
    <section className="banners">
      <Status loading={loading} error={error} />
      {data?.data.map((b) => (
        <Link key={b.id} to={b.link} className="banner" style={{ background: `linear-gradient(120deg, ${b.color}, #12082b)` }}>
          <h2>{b.title}</h2>
          {b.subtitle && <p>{b.subtitle}</p>}
        </Link>
      ))}
    </section>
  )
}

// Display order of the platform entries; a platform that is not listed here still shows up, after these.
const PLATFORM_ORDER = ['PlayStation', 'Xbox', 'Steam', 'Nintendo', 'Epic Games']

function byPlatformOrder(a: string, b: string): number {
  const rank = (p: string) => (PLATFORM_ORDER.includes(p) ? PLATFORM_ORDER.indexOf(p) : PLATFORM_ORDER.length)
  return rank(a) - rank(b) || a.localeCompare(b)
}

/** Horizontal category strip under the hero: "Games", then one entry per platform taken from the catalog. */
function CategoryStrip() {
  const { data } = useFetch<Filters>('/filters')
  const items = [
    { label: 'Games', to: '/store', icon: 'grid' as const },
    ...[...(data?.platforms ?? [])].sort(byPlatformOrder).map((p) => ({ label: p, to: `/store?platform=${encodeURIComponent(p)}`, icon: platformIcon(p) })),
  ]
  return (
    <nav className="category-strip" aria-label="Browse categories">
      {items.map((item) => (
        <Link key={item.label} to={item.to} className="category">
          <span className="category-icon"><Icon name={item.icon} /></span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function ProductBlock({ title, path, more }: { title: string; path: string; more: string }) {
  const { data, loading, error } = useFetch<{ data: Product[] }>(path)
  return (
    <section>
      <div className="section-head section-title">
        <h2>{title}</h2>
      </div>
      <Status loading={loading} error={error} />
      <div className="row-scroll">{data?.data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      {data && data.data.length > 0 && (
        <div className="show-all">
          <Link to={more} className="btn">Show all</Link>
        </div>
      )}
    </section>
  )
}

function Genres() {
  const { data } = useFetch<Filters>('/filters')
  if (!data) return null
  return (
    <section>
      <div className="section-head section-title">
        <h2>Browse by genre</h2>
      </div>
      <div className="tiles">
        {data.genres.map((g) => (
          <Link key={g} to={`/store?genre=${encodeURIComponent(g)}`} className="tile">{g}</Link>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="container stack">
      <Banners />
      <CategoryStrip />
      <ProductBlock title="Best sellers" path="/home/best-sellers" more="/store?sort=popularity" />
      <ProductBlock title="Hot deals" path="/home/deals" more="/store?sort=discount" />
      <Genres />
    </div>
  )
}
