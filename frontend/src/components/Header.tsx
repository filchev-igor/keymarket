import { useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useFetch } from '../api'
import { useAuth } from '../auth'
import { useCart } from '../cart'
import type { Filters } from '../types'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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
      <div className="container header-inner" style={{ paddingBlock: 8 }}>
        {/* Placeholder wordmark: our own shape and name, not the reference logo */}
        <Link to="/" className="logo" aria-label="keymarket home">
          <span className="logo-mark">k</span>
          <span>key<b>market</b></span>
        </Link>

        <form className="search" onSubmit={search} role="search">
          <button type="submit" aria-label="Search">
            <SearchIcon />
          </button>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search for games, e.g. cyber drift"
            aria-label="Search games"
          />
        </form>

        <nav className="nav">
          <span className="currency">EUR</span>
          <Link to="/cart" className="icon-link" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <>
              <NavLink to="/orders" className="nav-text">My orders</NavLink>
              <button className="user-chip" onClick={() => logout().then(() => navigate('/'))} title="Sign out">
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-name">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register" className="btn btn-small">Register</Link>
            </>
          )}
        </nav>
      </div>

      <div className="subnav">
        <div className="container subnav-inner">
          <NavLink to="/store" end>All games</NavLink>
          <Link to="/store?sort=popularity">Best sellers</Link>
          <Link to="/store?sort=discount" className="hot">Hot deals</Link>
          <Link to="/store?sort=price_asc">Cheap games</Link>
          {filters.data?.platforms.map((p) => (
            <Link key={p} to={`/store?platform=${encodeURIComponent(p)}`}>{p}</Link>
          ))}
        </div>
      </div>
    </header>
  )
}
