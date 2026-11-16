import { Link } from 'react-router-dom'
import { useFetch } from '../api'
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

/** Quick links built from the catalog's own platforms. */
function PlatformChips() {
  const { data } = useFetch<Filters>('/filters')
  if (!data) return null
  return (
    <section className="chips-row" aria-label="Browse by platform">
      {data.platforms.map((p) => (
        <Link key={p} to={`/store?platform=${encodeURIComponent(p)}`} className="pill">{p}</Link>
      ))}
    </section>
  )
}

function ProductBlock({ title, path, more }: { title: string; path: string; more: string }) {
  const { data, loading, error } = useFetch<{ data: Product[] }>(path)
  return (
    <section>
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <Status loading={loading} error={error} />
      <div className="row-scroll">{data?.data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      {data && data.data.length > 0 && (
        <div className="show-all">
          <Link to={more} className="btn btn-outline">Show all</Link>
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
      <div className="section-head">
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
      <PlatformChips />
      <ProductBlock title="Best sellers" path="/home/best-sellers" more="/store?sort=popularity" />
      <ProductBlock title="Hot deals" path="/home/deals" more="/store?sort=discount" />
      <Genres />
    </div>
  )
}
