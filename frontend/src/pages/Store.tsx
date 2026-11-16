import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFetch } from '../api'
import { formatPrice } from '../format'
import Icon from '../components/Icon'
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
const SORTS_SEARCHING: [string, string][] = [
  ['', 'Relevance: Best match'],
  ['popularity', 'Popularity: Most popular'],
  ...OTHER_SORTS,
]

/** Filled sort icon drawn for this project: a down arrow next to four shrinking bars. Size comes from --sort-icon. */
const SortIcon = () => {
  return (
    <svg className="sort-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M5 2h2v10.6l2.3-2.3 1.4 1.4L6 16.4l-4.7-4.7 1.4-1.4L5 12.6V2z" />
      <rect x="12" y="3" width="8" height="2.4" />
      <rect x="12" y="7.6" width="6.4" height="2.4" />
      <rect x="12" y="12.2" width="4.8" height="2.4" />
      <rect x="12" y="16.8" width="3.2" height="2.4" />
    </svg>
  )
}

/** [1, '…', 4, 5, 6, '…', 20]: always the first and last page and the neighbours of the current one. */
const pageList = (page: number, last: number): (number | '…')[] => {
  const pages = new Set([1, last, page - 1, page, page + 1].filter((p) => p >= 1 && p <= last))
  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

const VISIBLE_OPTIONS = 6 // a longer list is collapsed to this many values
const SEARCH_FROM = 8 // a list longer than this gets a small search box

/**
 * Checkbox-style list of one filter's values. A long list has a search box, shows the first few values and an
 * "N more" / "Show less" link with a chevron. Searching shows every match; the selected value is always visible.
 */
const OptionList = ({
  name,
  label,
  options,
  selected,
  onPick,
}: {
  name: string
  label: string
  options: string[]
  selected: string | null
  onPick: (value: string) => void
}) => {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const collapsible = !needle && options.length > VISIBLE_OPTIONS + 1
  const shown = needle
    ? options.filter((o) => o.toLowerCase().includes(needle))
    : collapsible && !expanded
      ? options.filter((o, i) => i < VISIBLE_OPTIONS || o === selected)
      : options

  return (
    <>
      {options.length > SEARCH_FROM && (
        <div className="filter-search">
          <span className="filter-search-icon">
            <Icon name="search" />
          </span>
          <input
            type="text"
            aria-label={`Search filter options - ${label}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}
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
        {shown.length === 0 && <p className="muted small">No matches</p>}
        {collapsible && (
          <button
            type="button"
            className="link-button show-more"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Show less' : `${options.length - shown.length} more`}
            <span className={`chevron${expanded ? ' up' : ''}`} aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  )
}

/** A collapsible filter group: a title row (with a yellow count badge when something is selected) and its content. */
const FilterGroup = ({
  title,
  count = 0,
  children,
}: {
  title: string
  count?: number
  children: ReactNode
}) => {
  return (
    <details className="filter-group" open>
      <summary>
        <span className="group-title">
          {title}
          {count > 0 && (
            <span className="group-badge" aria-label={`${count} selected`}>
              {count}
            </span>
          )}
        </span>
      </summary>
      {children}
    </details>
  )
}

// The URL is the single source of truth for filters, so results are shareable and the back button works.
const Store = () => {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false) // only used on phones, where the sidebar is collapsed
  const filters = useFetch<Filters>('/filters')
  const results = useFetch<Paginated<Product>>(`/products?${params.toString()}`)

  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 1)
  // Prices are cents in the API, euros in the form.
  const [min, setMin] = useState(
    params.get('min_price') ? String(Number(params.get('min_price')) / 100) : '',
  )
  const [max, setMax] = useState(
    params.get('max_price') ? String(Number(params.get('max_price')) / 100) : '',
  )

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page') // any filter change goes back to page 1
    setParams(next)
  }

  // "12,5" or "12.5" euros -> "1250" cents; anything that is not a non-negative number means "no limit".
  const toCents = (text: string) => {
    const n = Number(text.trim().replace(',', '.'))
    return text.trim() !== '' && Number.isFinite(n) && n >= 0 ? String(Math.round(n * 100)) : ''
  }

  // The price range applies when you press Enter or leave a field (there is no Apply button), only if it changed.
  const applyPrice = () => {
    const minCents = toCents(min)
    const maxCents = toCents(max)
    if (
      minCents === (params.get('min_price') ?? '') &&
      maxCents === (params.get('max_price') ?? '')
    )
      return
    update({ min_price: minCents, max_price: maxCents })
  }

  const applyPriceOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyPrice()
  }

  const clearAll = () => {
    setMin('')
    setMax('')
    setParams(q ? { q } : {})
  }

  // Selected filters, shown as removable pills above the grid ("Platform: Steam ✕").
  const active: { label: string; value: string; params: string[] }[] = []
  for (const [name, label] of [
    ['platform', 'Platform'],
    ['region', 'Region'],
    ['genre', 'Genre'],
  ] as const) {
    const v = params.get(name)
    if (v) active.push({ label, value: v, params: [name] })
  }
  const minPrice = params.get('min_price')
  const maxPrice = params.get('max_price')
  if (minPrice || maxPrice) {
    const value =
      minPrice && maxPrice
        ? `${formatPrice(Number(minPrice))} - ${formatPrice(Number(maxPrice))}`
        : minPrice
          ? `from ${formatPrice(Number(minPrice))}`
          : `up to ${formatPrice(Number(maxPrice))}`
    active.push({ label: 'Price', value, params: ['min_price', 'max_price'] })
  }

  const removeFilter = (names: string[]) => {
    if (names.includes('min_price')) {
      setMin('')
      setMax('')
    }
    update(Object.fromEntries(names.map((n) => [n, ''])))
  }

  const optionList = (name: string, label: string, options: string[] = []) => (
    <OptionList
      name={name}
      label={label}
      options={options}
      selected={params.get(name)}
      onPick={(value) => update({ [name]: value })}
    />
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

      <button
        className="pill filters-toggle"
        onClick={() => setFiltersOpen((o) => !o)}
        aria-expanded={filtersOpen}
      >
        {filtersOpen ? 'Hide filters' : `Filters${active.length ? ` (${active.length})` : ''}`}
      </button>

      <div className="store">
        <aside className={`filters${filtersOpen ? ' open' : ''}`} aria-label="Filters">
          <div className="filters-head">
            <span>Filters</span>
            <button className="link-button" onClick={clearAll}>
              Clear all
            </button>
          </div>
          <FilterGroup title="Price range (EUR)" count={minPrice || maxPrice ? 1 : 0}>
            <div className="price-filter">
              <div className="range">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Min"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  onBlur={applyPrice}
                  onKeyDown={applyPriceOnEnter}
                  aria-label="Price range - Minimum value"
                />
                <strong>-</strong>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Max"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  onBlur={applyPrice}
                  onKeyDown={applyPriceOnEnter}
                  aria-label="Price range - Maximum value"
                />
              </div>
            </div>
          </FilterGroup>
          <FilterGroup title="Platforms" count={params.get('platform') ? 1 : 0}>
            {optionList('platform', 'Platforms', filters.data?.platforms)}
          </FilterGroup>
          <FilterGroup title="Regions" count={params.get('region') ? 1 : 0}>
            {optionList('region', 'Regions', filters.data?.regions)}
          </FilterGroup>
          <FilterGroup title="Genres" count={params.get('genre') ? 1 : 0}>
            {optionList('genre', 'Genres', filters.data?.genres)}
          </FilterGroup>
        </aside>

        <main>
          {active.length > 0 && (
            <div className="filter-pills">
              {active.map((f) => (
                <button
                  key={f.label}
                  className="pill"
                  onClick={() => removeFilter(f.params)}
                  aria-label={`Remove ${f.label} filter ${f.value}`}
                >
                  {f.label}: {f.value} ✕
                </button>
              ))}
              <button className="link-button clear-all" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}
          <div className="results-bar">
            <span className="results-found">{meta ? `Results found: ${meta.total}` : ''}</span>
            <label className="sort">
              <SortIcon />
              <select
                aria-label="Sort by"
                value={params.get('sort') ?? ''}
                onChange={(e) => update({ sort: e.target.value })}
              >
                {(q ? SORTS_SEARCHING : SORTS_BROWSING).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Status loading={results.loading} error={results.error} />
          {results.data && (
            <>
              {results.data.data.length === 0 && (
                <p>No games match your search. Try fewer filters or another spelling.</p>
              )}
              <div className="grid">
                {results.data.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {results.data.meta.last_page > 1 && (
                <nav className="pager" aria-label="Pages">
                  <button
                    disabled={page <= 1}
                    onClick={() => update({ page: String(page - 1) })}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {pageList(results.data.meta.page, results.data.meta.last_page).map((p, i) =>
                    p === '…' ? (
                      <span key={`gap${i}`} className="muted">
                        …
                      </span>
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
                  <button
                    disabled={page >= results.data.meta.last_page}
                    onClick={() => update({ page: String(page + 1) })}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Store
