import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { useCart } from '../cart'

export default function Header() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')

  // The search box is in the header so it works from every page; results show in the store.
  function search(e: FormEvent) {
    e.preventDefault()
    const q = term.trim()
    navigate(q ? `/store?q=${encodeURIComponent(q)}` : '/store')
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          key<span>market</span>
        </Link>

        <form className="search" onSubmit={search} role="search">
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search games, e.g. cyber drift"
            aria-label="Search games"
          />
          <button type="submit">Search</button>
        </form>

        <nav className="nav">
          <Link to="/store">Store</Link>
          <Link to="/cart" className="cart-link">
            Cart{count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <>
              <Link to="/orders">My orders</Link>
              <button className="link-button" onClick={() => logout().then(() => navigate('/'))}>
                Sign out ({user.name})
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register" className="btn btn-small">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
