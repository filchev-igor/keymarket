import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart'
import { formatPrice } from '../format'
import type { Order } from '../types'
import { useCartPreview } from './Cart'

export default function Checkout() {
  const cart = useCart()
  const navigate = useNavigate()
  const { preview, error: previewError } = useCartPreview()
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  async function pay(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPaying(true)
    try {
      const r = await api<{ data: Order }>('/checkout', {
        method: 'POST',
        body: { items: cart.items, payment: { card_number: card } },
      })
      cart.clear()
      navigate(`/orders/${r.data.id}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setPaying(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link to="/store" className="btn">Browse games</Link>
      </div>
    )
  }

  const blocked = !preview || preview.items.some((l) => !l.available)

  return (
    <div className="container checkout">
      <div>
        <h1>Checkout</h1>
        {previewError && <p className="error">{previewError}</p>}
        {preview?.items.map((l) => (
          <div key={l.offer_id} className="cart-line compact">
            <span>{l.quantity} × {l.product?.name ?? 'Unavailable offer'} <span className="muted">({l.seller?.name})</span></span>
            <strong>{formatPrice(l.line_total)}</strong>
          </div>
        ))}
        {preview?.items.some((l) => !l.available) && (
          <p className="error">Some items are no longer available. <Link to="/cart">Fix your cart</Link></p>
        )}
        <p>Total: <strong className="price big">{formatPrice(preview?.total ?? 0)}</strong></p>
      </div>

      <form onSubmit={pay} className="panel">
        <h2>Payment</h2>
        <p className="notice">Simulated payment: no real money is involved. Any 12-19 digit number works; a number ending in 0002 is declined.</p>
        <label>
          Card number
          <input value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" autoComplete="off" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={paying || blocked}>
          {paying ? 'Processing...' : `Pay ${formatPrice(preview?.total ?? 0)}`}
        </button>
      </form>
    </div>
  )
}
