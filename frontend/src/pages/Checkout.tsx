import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart'
import { formatPrice } from '../format'
import type { Order } from '../types'
import { useCartPreview } from './Cart'

const APPROVED_CARD = '4242424242424242'
const DECLINED_CARD = '4000000000000002' // ends in 0002: the simulated payment declines it

/** Keeps digits only (so pasted spaces, dashes and look-alike characters can't sneak in) and groups them by 4. */
function formatCard(value: string): string {
  return (value.replace(/\D/g, '').slice(0, 19).match(/.{1,4}/g) ?? []).join(' ')
}

export default function Checkout() {
  const cart = useCart()
  const navigate = useNavigate()
  const { preview, error: previewError } = useCartPreview()
  // Starts empty on purpose: a pre-filled approved card made it too easy to pay with a card you didn't mean to use.
  const [card, setCard] = useState('')
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

  const digits = card.replace(/\D/g, '')
  const blocked = !preview || preview.items.some((l) => !l.available) || digits.length < 12

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
          Test card number
          <input
            name="demo-test-card"
            value={card}
            onChange={(e) => setCard(formatCard(e.target.value))}
            placeholder="Type a number or use a button below"
            inputMode="numeric"
            autoComplete="off"
            required
          />
        </label>
        <div className="card-presets">
          <button type="button" className="btn btn-small btn-outline" onClick={() => setCard(formatCard(APPROVED_CARD))}>
            Use approved test card
          </button>
          <button type="button" className="btn btn-small btn-outline" onClick={() => setCard(formatCard(DECLINED_CARD))}>
            Use declined test card
          </button>
        </div>
        <p className="card-summary">
          {digits.length >= 4 ? <>Card ending in <strong>{digits.slice(-4)}</strong></> : <span className="muted">No card entered yet</span>}
          {digits.endsWith('0002') && <span className="muted"> · this test card will be declined</span>}
        </p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={paying || blocked}>
          {paying ? 'Processing...' : `Pay ${formatPrice(preview?.total ?? 0)}`}
        </button>
      </form>
    </div>
  )
}
