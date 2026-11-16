import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart'
import { Cover } from '../components/ProductCard'
import Spinner from '../components/Spinner'
import Stepper from '../components/Stepper'
import { formatPrice } from '../format'
import type { CartPreview } from '../types'

/** Loads current prices and availability for the cart from the server. */
export function useCartPreview() {
  const { items } = useCart()
  const [preview, setPreview] = useState<CartPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(items)

  useEffect(() => {
    if (items.length === 0) {
      setPreview(null)
      return
    }
    let cancelled = false
    api<CartPreview>('/cart/preview', { method: 'POST', body: { items } })
      .then((p) => !cancelled && setPreview(p))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the serialised `items`
  }, [key])

  return { preview, error }
}

export default function Cart() {
  const cart = useCart()
  const navigate = useNavigate()
  const { preview, error } = useCartPreview()

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <Stepper step={1} />
        <div className="panel">
          <h1>My cart</h1>
          <p>Your cart is empty.</p>
          <Link to="/store" className="btn">Browse games</Link>
        </div>
      </div>
    )
  }

  const hasUnavailable = preview?.items.some((l) => !l.available) ?? false

  return (
    <div className="container">
      <Stepper step={1} />
      {error && <p className="error">{error}</p>}
      {!preview && !error && <Spinner centered label="Loading prices" />}

      {preview && (
        <div className="two-col">
          <section className="panel">
            <h1>My cart</h1>
            <div className="cart-lines">
              {preview.items.map((line) => (
                <div key={line.offer_id} className={`cart-line${line.available ? '' : ' unavailable'}`}>
                  {line.product ? <Cover name={line.product.name} color={line.product.cover_color} thumb /> : <span />}
                  <div>
                    {line.seller && <p className="seller-line">Sold by <strong>{line.seller.name}</strong></p>}
                    {line.product ? (
                      <Link to={`/product/${line.product.slug}`}><strong>{line.product.name}</strong></Link>
                    ) : (
                      <strong>Offer no longer exists</strong>
                    )}
                    {line.product && (
                      <p className="muted small" style={{ margin: '4px 0 0' }}>
                        Digital key · {line.product.platform} · {line.product.region}
                      </p>
                    )}
                    {!line.available && <p className="error small">Not enough stock. Lower the quantity or remove it.</p>}
                  </div>
                  <div className="qty" role="group" aria-label="Quantity">
                    <button onClick={() => cart.setQuantity(line.offer_id, line.quantity - 1)} disabled={line.quantity <= 1} aria-label="Decrease quantity">−</button>
                    <span>{line.quantity}</span>
                    <button onClick={() => cart.setQuantity(line.offer_id, line.quantity + 1)} disabled={line.quantity >= 10} aria-label="Increase quantity">+</button>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{line.unit_price === null ? '-' : formatPrice(line.line_total)}</strong>
                    <div><button className="link-button" onClick={() => cart.remove(line.offer_id)}>Remove</button></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="panel" aria-label="Summary">
            <h2>Summary</h2>
            <button className="btn btn-block" disabled={hasUnavailable || preview.total === 0} onClick={() => navigate('/checkout')}>
              Go to checkout
            </button>
            <div className="summary-row" style={{ marginTop: 16 }}>
              <span>{cart.count} {cart.count === 1 ? 'item' : 'items'}</span>
              <span>{formatPrice(preview.total)}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="price big">{formatPrice(preview.total)}</span>
            </div>
            <p className="muted small">You will be asked to sign in before paying.</p>
          </aside>
        </div>
      )}
    </div>
  )
}
