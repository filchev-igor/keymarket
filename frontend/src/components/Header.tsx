import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useFetch } from '../api'
import { useAuth } from '../auth'
import { useCart } from '../cart'
import type { Filters } from '../types'
import Icon from './Icon'

/** Thin-line magnifier, drawn for this project; its size comes from --search-icon. */
function SearchIcon() {
  return (
    <svg
      className="search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="8" />
      <path d="m16.5 16.5 5.5 5.5" />
    </svg>
  )
}

/** Person icon (supplied artwork, filled, 24x25 grid); its width comes from --account-icon and its height follows. */
function UserIcon() {
  return (
    <svg className="account-icon" fill="none" viewBox="0 0 24 25" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M11.667 1.75a5.417 5.417 0 1 0 0 10.834 5.417 5.417 0 0 0 0-10.834Zm-2.77 2.647a3.917 3.917 0 1 1 5.54 5.54 3.917 3.917 0 0 1-5.54-5.54ZM6.07 16.902A7.917 7.917 0 0 1 19.583 22.5a.75.75 0 0 0 1.5 0 9.417 9.417 0 1 0-18.833 0 .75.75 0 0 0 1.5 0c0-2.1.834-4.113 2.319-5.598Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Small cross for the "clear search text" button; its size comes from --search-clear-icon. */
function ClearIcon() {
  return (
    <svg
      className="search-clear-icon"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m2 2 10 10M12 2 2 12" />
    </svg>
  )
}

/** Cart outline (supplied artwork, 16x16 grid, 1px strokes); its size comes from --cart-icon. */
function CartIcon() {
  return (
    <svg className="cart-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M12 12.7499H5.386C5.1498 12.75 4.9212 12.6664 4.74067 12.5139C4.5602 12.3615 4.43953 12.1502 4.4 11.9173L2.642 1.58395C2.60233 1.35119 2.4816 1.13996 2.30113 0.987686C2.12067 0.835406 1.89213 0.7519 1.656 0.751953H1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.75 14.75C10.8881 14.75 11 14.6381 11 14.5C11 14.3619 10.8881 14.25 10.75 14.25"
        stroke="currentColor"
      />
      <path
        d="M10.75 14.75C10.6119 14.75 10.5 14.6381 10.5 14.5C10.5 14.3619 10.6119 14.25 10.75 14.25"
        stroke="currentColor"
      />
      <path
        d="M5.75 14.75C5.88807 14.75 6 14.6381 6 14.5C6 14.3619 5.88807 14.25 5.75 14.25"
        stroke="currentColor"
      />
      <path
        d="M5.75 14.75C5.61193 14.75 5.5 14.6381 5.5 14.5C5.5 14.3619 5.61193 14.25 5.75 14.25"
        stroke="currentColor"
      />
      <path
        d="M4.03141 9.75007H12.0787C12.5247 9.75001 12.9578 9.60094 13.3093 9.32647C13.6608 9.05207 13.9105 8.66801 14.0187 8.23541L14.9854 4.36873C15.0038 4.29499 15.0052 4.21802 14.9895 4.14366C14.9737 4.0693 14.9412 3.99952 14.8944 3.93961C14.8476 3.87971 14.7878 3.83126 14.7194 3.79795C14.6511 3.76465 14.5761 3.74736 14.5001 3.7474H3.01075"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const location = useLocation()
  // Phones: the category list is closed until the "Categories" button is pressed. It remembers the page it was opened
  // on (location.key), so it closes by itself as soon as the visitor goes anywhere.
  const [openAt, setOpenAt] = useState<string | null>(null)
  const navOpen = openAt === location.key
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenAt(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen])
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
          <span>
            key<b>market</b>
          </span>
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
          <Link to="/cart" className="icon-link" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="nav-text">
                My orders
              </Link>
              <button
                className="user-chip"
                onClick={() => logout().then(() => navigate('/'))}
                title="Sign out"
              >
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-name">Sign out</span>
              </button>
            </>
          ) : (
            // Plain text links separated by a thin divider, like the reference (no coloured button)
            <span className="account">
              <Link to="/login" className="account-link" aria-label="Log in">
                <UserIcon />
                <span className="account-text">Log in</span>
              </Link>
              <span className="account-sep" aria-hidden="true">
                |
              </span>
              <Link to="/register" className="account-register">
                Register
              </Link>
            </span>
          )}
        </nav>
      </div>

      <div className="subnav">
        <div className="container subnav-inner">
          {/* Phones: one button opens the list of links (the "disclosure" pattern); wider screens show the links in a row */}
          <button
            type="button"
            className="subnav-toggle"
            aria-expanded={navOpen}
            aria-controls="store-nav"
            onClick={() => setOpenAt(navOpen ? null : location.key)}
          >
            <span className="subnav-toggle-icon">
              <Icon name="menu" />
            </span>
            <span>Categories</span>
            <span className={`chevron${navOpen ? ' up' : ''}`} aria-hidden="true" />
          </button>
          <nav
            id="store-nav"
            className={`subnav-links${navOpen ? ' open' : ''}`}
            aria-label="Browse the store"
          >
            <Link to="/store">All games</Link>
            <Link to="/store?sort=popularity">Best sellers</Link>
            <Link to="/store?sort=discount">Hot deals</Link>
            <Link to="/store?sort=price_asc">Cheap games</Link>
            {filters.data?.platforms.map((p) => (
              <Link key={p} to={`/store?platform=${encodeURIComponent(p)}`}>
                {p}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
