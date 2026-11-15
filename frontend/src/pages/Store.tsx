import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFetch } from '../api'
import ProductCard from '../components/ProductCard'
import Status from '../components/Status'
import type { Filters, Paginated, Product } from '../types'

const SORTS = [
  ['', 'Default'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['discount', 'Biggest discount'],
  ['popularity', 'Most popular'],
  ['name', 'Name A-Z'],
]

// The URL is the single source of truth for filters, so results are shareable and the back button works.
export default function Store() {
  const [params, setParams] = useSearchParams()
  const filters = useFetch<Filters>('/filters')
  const results = useFetch<Paginated<Product>>(`/products?${params.toString()}`)

  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 1)
  // Prices are cents in the API, euros in the form.
  const [min, setMin] = useState(params.get('min_price') ? String(Number(params.get('min_price')) / 100) : '')
  const [max, setMax] = useState(params.get('max_price') ? String(Number(params.get('max_price')) / 100) : '')

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page') // any filter change goes back to page 1
    setParams(next)
  }

  function applyPrice(e: FormEvent) {
    e.preventDefault()
    update({
      min_price: min ? String(Math.round(Number(min) * 100)) : '',
      max_price: max ? String(Math.round(Number(max) * 100)) : '',
    })
  }

  function clearAll() {
    setMin('')
    setMax('')
    setParams(q ? { q } : {})
  }

  const select = (name: string, label: string, options: string[] = []) => (
    <label>
      {label}
      <select value={params.get(name) ?? ''} onChange={(e) => update({ [name]: e.target.value })}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="container store">
      <aside className="filters">
        <h2>Filters</h2>
        {select('platform', 'Platform', filters.data?.platforms)}
        {select('region', 'Region', filters.data?.regions)}
        {select('genre', 'Genre', filters.data?.genres)}
        <form onSubmit={applyPrice} className="price-filter">
          <span>Price (EUR)</span>
          <div>
            <input type="number" min="0" step="1" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum price" />
            <input type="number" min="0" step="1" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum price" />
          </div>
          <button type="submit" className="btn btn-small">Apply</button>
        </form>
        <button className="link-button" onClick={clearAll}>Clear filters</button>
      </aside>

      <main>
        <div className="section-head">
          <h1>{q ? `Results for "${q}"` : 'All games'}</h1>
          <label className="sort">
            Sort by
            <select value={params.get('sort') ?? ''} onChange={(e) => update({ sort: e.target.value })}>
              {q && <option value="">Best match</option>}
              {SORTS.filter(([v]) => v || !q).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <Status loading={results.loading} error={results.error} />
        {results.data && (
          <>
            <p className="muted">{results.data.meta.total} products</p>
            {results.data.data.length === 0 && <p>No games match your search. Try fewer filters or another spelling.</p>}
            <div className="grid">
              {results.data.data.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {results.data.meta.last_page > 1 && (
              <div className="pager">
                <button className="btn btn-small" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
                <span>Page {results.data.meta.page} of {results.data.meta.last_page}</span>
                <button className="btn btn-small" disabled={page >= results.data.meta.last_page} onClick={() => update({ page: String(page + 1) })}>Next</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
