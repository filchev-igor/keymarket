import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart'
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
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/store" className="btn">Browse games</Link>
      </div>
    )
  }

  const hasUnavailable = preview?.items.some((l) => !l.available) ?? false

  return (
    <div className="container stack">
      <h1>Your cart</h1>
      {error && <p className="error">{error}</p>}
      {!preview && !error && <p className="muted">Loading prices...</p>}

      {preview && (
        <>
          <div className="cart-lines">
            {preview.items.map((line) => (
              <div key={line.offer_id} className={`cart-line ${line.available ? '' : 'unavailable'}`}>
                <div>
                  {line.product ? (
                    <Link to={`/product/${line.product.slug}`}><strong>{line.product.name}</strong></Link>
                  ) : (
                    <strong>Offer no longer exists</strong>
                  )}
                  {line.product && <p className="muted">{line.product.platform} · {line.product.region} · sold by {line.seller?.name}</p>}
                  {!line.available && <p className="error">Not enough stock. Lower the quantity or remove it.</p>}
                </div>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={line.quantity}
                  onChange={(e) => cart.setQuantity(line.offer_id, Number(e.target.value))}
                  aria-label="Quantity"
                />
                <strong>{line.unit_price === null ? '-' : formatPrice(line.line_total)}</strong>
                <button className="link-button" onClick={() => cart.remove(line.offer_id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="summary">
            <p>Total: <strong className="price big">{formatPrice(preview.total)}</strong></p>
            <button className="btn" disabled={hasUnavailable || preview.total === 0} onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
            <p className="muted">You will be asked to sign in before paying.</p>
          </div>
        </>
      )}
    </div>
  )
}
