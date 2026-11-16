import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFetch } from '../api'
import { useAuth } from '../auth'
import { useCart } from '../cart'
import type { Filters } from '../types'

/** Thin-line magnifier, drawn for this project; its size comes from --search-icon. */
function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="8" />
      <path d="m16.5 16.5 5.5 5.5" />
    </svg>
  )
}

/** Small cross for the "clear search text" button; its size comes from --search-clear-icon. */
function ClearIcon() {
  return (
    <svg className="search-clear-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="m2 2 10 10M12 2 2 12" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6.2" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  )
}

export default function Header() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  // The platform links of the second row come from the API, so they always match the catalog.
  const filters = useFetch<Filters>('/filters')

  // The search box is in the header so it works from every page; results show in the store.
  function search(e: FormEvent) {
    e.preventDefault()
    const q = term.trim()
    navigate(q ? `/store?q=${encodeURIComponent(q)}` : '/store')
  }

  return (
    <header className="header">
      <div className="container header-inner">
        {/* Placeholder wordmark: our own shape and name, not the reference logo */}
        <Link to="/" className="logo" aria-label="keymarket home">
          <span className="logo-mark">k</span>
          <span>key<b>market</b></span>
        </Link>

        <form className="search" onSubmit={search} role="search">
          <button type="submit" className="search-submit" aria-label="Search">
            <SearchIcon />
          </button>
          <input
            ref={inputRef}
            type="search"
            name="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search for games, e.g. cyber drift"
            aria-label="Search games"
            autoComplete="off"
            autoCorrect="off"
          />
          {/* Appears only when there is text; clears it and keeps the focus in the box */}
          {term && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search text"
              title="Clear search text"
              onClick={() => {
                setTerm('')
                inputRef.current?.focus()
              }}
            >
              <ClearIcon />
            </button>
          )}
        </form>

        <nav className="nav">
          <span className="currency">EUR</span>
          <Link to="/cart" className="icon-link" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="nav-text">My orders</Link>
              <button className="user-chip" onClick={() => logout().then(() => navigate('/'))} title="Sign out">
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-name">Sign out</span>
              </button>
            </>
          ) : (
            // Plain text links separated by a thin divider, like the reference (no coloured button)
            <span className="account">
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </span>
          )}
        </nav>
      </div>

      <div className="subnav">
        <div className="container subnav-inner">
          <Link to="/store">All games</Link>
          <Link to="/store?sort=popularity">Best sellers</Link>
          <Link to="/store?sort=discount">Hot deals</Link>
          <Link to="/store?sort=price_asc">Cheap games</Link>
          {filters.data?.platforms.map((p) => (
            <Link key={p} to={`/store?platform=${encodeURIComponent(p)}`}>{p}</Link>
          ))}
        </div>
      </div>
    </header>
  )
}
