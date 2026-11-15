import { Link } from 'react-router-dom'
import { useFetch } from '../api'
import ProductCard from '../components/ProductCard'
import Status from '../components/Status'
import type { Banner, Product } from '../types'

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

function ProductBlock({ title, path, more }: { title: string; path: string; more: string }) {
  const { data, loading, error } = useFetch<{ data: Product[] }>(path)
  return (
    <section>
      <div className="section-head">
        <h2>{title}</h2>
        <Link to={more}>See all</Link>
      </div>
      <Status loading={loading} error={error} />
      <div className="grid">{data?.data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="container stack">
      <Banners />
      <ProductBlock title="Best sellers" path="/home/best-sellers" more="/store?sort=popularity" />
      <ProductBlock title="Hot deals" path="/home/deals" more="/store?sort=discount" />
    </div>
  )
}
