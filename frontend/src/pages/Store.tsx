import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFetch } from '../api'
import { formatPrice } from '../format'
import ProductCard from '../components/ProductCard'
import Status from '../components/Status'
import type { Filters, Paginated, Product } from '../types'

// Labels read "Sort: value", like the reference. With a search term the default order is relevance.
const OTHER_SORTS: [string, string][] = [
  ['price_asc', 'Price: Low to high'],
  ['price_desc', 'Price: High to low'],
  ['discount', 'Discount: Biggest first'],
  ['name', 'Name: A to Z'],
]
const SORTS_BROWSING: [string, string][] = [['', 'Popularity: Most popular'], ...OTHER_SORTS]
const SORTS_SEARCHING: [string, string][] = [['', 'Relevance: Best match'], ['popularity', 'Popularity: Most popular'], ...OTHER_SORTS]

/** Small sort icon (two arrows) drawn for this project. */
function SortIcon() {
  return (
    <svg className="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16M7 4 3.5 7.5M7 4l3.5 3.5M17 20V4M17 20l-3.5-3.5M17 20l3.5-3.5" />
    </svg>
  )
}

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

  // Selected filters, shown as removable pills above the grid ("Platform: Steam ✕").
  const active: { label: string; value: string; params: string[] }[] = []
  for (const [name, label] of [['platform', 'Platform'], ['region', 'Region'], ['genre', 'Genre']] as const) {
    const v = params.get(name)
    if (v) active.push({ label, value: v, params: [name] })
  }
  const minPrice = params.get('min_price')
  const maxPrice = params.get('max_price')
  if (minPrice || maxPrice) {
    const value = minPrice && maxPrice ? `${formatPrice(Number(minPrice))} - ${formatPrice(Number(maxPrice))}` : minPrice ? `from ${formatPrice(Number(minPrice))}` : `up to ${formatPrice(Number(maxPrice))}`
    active.push({ label: 'Price', value, params: ['min_price', 'max_price'] })
  }

  function removeFilter(names: string[]) {
    if (names.includes('min_price')) {
      setMin('')
      setMax('')
    }
    update(Object.fromEntries(names.map((n) => [n, ''])))
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
          {active.length > 0 && (
            <div className="filter-pills">
              {active.map((f) => (
                <button key={f.label} className="pill" onClick={() => removeFilter(f.params)} aria-label={`Remove ${f.label} filter ${f.value}`}>
                  {f.label}: {f.value} ✕
                </button>
              ))}
              <button className="link-button clear-all" onClick={clearAll}>Clear all</button>
            </div>
          )}
          <div className="results-bar">
            <span className="results-found">{meta ? `Results found: ${meta.total}` : ''}</span>
            <label className="sort">
              <SortIcon />
              <select aria-label="Sort by" value={params.get('sort') ?? ''} onChange={(e) => update({ sort: e.target.value })}>
                {(q ? SORTS_SEARCHING : SORTS_BROWSING).map(([v, label]) => (
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
