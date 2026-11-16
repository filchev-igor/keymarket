import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

/** [1, '…', 4, 5, 6, '…', 20]: always the first and last page and the neighbours of the current one. */
function pageList(page: number, last: number): (number | '…')[] {
  const pages = new Set([1, last, page - 1, page, page + 1].filter((p) => p >= 1 && p <= last))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

const VISIBLE_OPTIONS = 6

/** Checkbox-style list of one filter's values; long lists show the first few and a "Show more" toggle. */
function OptionList({ name, options, selected, onPick }: { name: string; options: string[]; selected: string | null; onPick: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  // Keep the selected value visible even when the list is collapsed.
  const shown = expanded || options.length <= VISIBLE_OPTIONS + 1 ? options : options.filter((o, i) => i < VISIBLE_OPTIONS || o === selected)
  return (
    <div className="filter-options">
      {shown.map((o) => {
        const isSelected = selected === o
        return (
          <button
            key={`${name}-${o}`}
            type="button"
            className={`option${isSelected ? ' selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onPick(isSelected ? '' : o)}
          >
            <span className="checkbox" aria-hidden="true" />
            {o}
          </button>
        )
      })}
      {options.length > VISIBLE_OPTIONS + 1 && (
        <button type="button" className="link-button show-more" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show less' : `Show more (${options.length - shown.length})`}
        </button>
      )}
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="filter-group" open>
      <summary>{title}</summary>
      {children}
    </details>
  )
}

// The URL is the single source of truth for filters, so results are shareable and the back button works.
export default function Store() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false) // only used on phones, where the sidebar is collapsed
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

  const active: [string, string, string][] = [] // [param, label, value]
  for (const [name, label] of [['platform', 'Platform'], ['region', 'Region'], ['genre', 'Genre']] as const) {
    const v = params.get(name)
    if (v) active.push([name, label, v])
  }

  const optionList = (name: string, options: string[] = []) => (
    <OptionList name={name} options={options} selected={params.get(name)} onPick={(value) => update({ [name]: value })} />
  )

  const meta = results.data?.meta

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>Store</span>
        {q && <span>Search</span>}
      </nav>
      <div className="section-head">
        <h1>{q ? `Results for "${q}"` : 'All games'}</h1>
      </div>

      <button className="pill filters-toggle" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
        {filtersOpen ? 'Hide filters' : `Filters${active.length ? ` (${active.length})` : ''}`}
      </button>

      <div className="store">
        <aside className={`filters${filtersOpen ? ' open' : ''}`} aria-label="Filters">
          <div className="filters-head">
            <span>Filters</span>
            <button className="link-button" onClick={clearAll}>Clear all</button>
          </div>
          <FilterGroup title="Price (EUR)">
            <form onSubmit={applyPrice} className="price-filter">
              <div className="range">
                <input type="number" min="0" step="1" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum price" />
                <span>-</span>
                <input type="number" min="0" step="1" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum price" />
              </div>
              <button type="submit" className="btn btn-small">Apply</button>
            </form>
          </FilterGroup>
          <FilterGroup title="Platform">{optionList('platform', filters.data?.platforms)}</FilterGroup>
          <FilterGroup title="Region">{optionList('region', filters.data?.regions)}</FilterGroup>
          <FilterGroup title="Genre">{optionList('genre', filters.data?.genres)}</FilterGroup>
        </aside>

        <main>
          <div className="results-bar">
            <div className="active-filters" style={{ margin: 0 }}>
              {active.map(([name, label, value]) => (
                <button key={name} className="pill" onClick={() => update({ [name]: '' })} aria-label={`Remove ${label} filter ${value}`}>
                  {value} ✕
                </button>
              ))}
              {meta && <span className="muted small">{meta.total} products</span>}
            </div>
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
              {results.data.data.length === 0 && <p>No games match your search. Try fewer filters or another spelling.</p>}
              <div className="grid">
                {results.data.data.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {results.data.meta.last_page > 1 && (
                <nav className="pager" aria-label="Pages">
                  <button disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} aria-label="Previous page">‹</button>
                  {pageList(results.data.meta.page, results.data.meta.last_page).map((p, i) =>
                    p === '…' ? (
                      <span key={`gap${i}`} className="muted">…</span>
                    ) : (
                      <button
                        key={p}
                        className={p === results.data!.meta.page ? 'current' : ''}
                        aria-current={p === results.data!.meta.page ? 'page' : undefined}
                        onClick={() => update({ page: String(p) })}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button disabled={page >= results.data.meta.last_page} onClick={() => update({ page: String(page + 1) })} aria-label="Next page">›</button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
