import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart'
import { Cover } from '../components/ProductCard'
import Spinner from '../components/Spinner'
import Stepper from '../components/Stepper'
import { formatPrice } from '../format'
import type { Order } from '../types'
import { useCartPreview } from './Cart'

const APPROVED_CARD = '4242424242424242'
const DECLINED_CARD = '4000000000000002' // ends in 0002: the simulated payment declines it

/** Keeps digits only (so pasted spaces, dashes and look-alike characters can't sneak in) and groups them by 4. */
const formatCard = (value: string): string => {
  return (
    value
      .replace(/\D/g, '')
      .slice(0, 19)
      .match(/.{1,4}/g) ?? []
  ).join(' ')
}

const Checkout = () => {
  const cart = useCart()
  const navigate = useNavigate()
  const { preview, error: previewError } = useCartPreview()
  // Starts empty on purpose: a pre-filled approved card made it too easy to pay with a card you didn't mean to use.
  const [card, setCard] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  const pay = async (e: FormEvent) => {
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
        <Stepper step={2} />
        <div className="panel">
          <h1>Checkout</h1>
          <p>Your cart is empty.</p>
          <Link to="/store" className="btn">
            Browse games
          </Link>
        </div>
      </div>
    )
  }

  const digits = card.replace(/\D/g, '')
  const blocked = !preview || preview.items.some((l) => !l.available) || digits.length < 12

  return (
    <div className="container">
      <Stepper step={2} />
      {/* One form around both columns: the payment method is on the left, the pay button lives in the summary on the right */}
      <form onSubmit={pay} className="two-col">
        <section>
          <h1>Payment</h1>
          <div className="method selected">
            <div className="method-head">
              <span className="radio checked" aria-hidden="true" />
              <div>
                <strong>Test card</strong>
                <p className="muted small" style={{ margin: '2px 0 0' }}>
                  Simulated payment: no real money is involved. Any 12-19 digit number works; a
                  number ending in 0002 is declined.
                </p>
              </div>
            </div>
            <div className="method-body">
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
                <button
                  type="button"
                  className="btn btn-small btn-outline"
                  onClick={() => setCard(formatCard(APPROVED_CARD))}
                >
                  Use approved test card
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-outline"
                  onClick={() => setCard(formatCard(DECLINED_CARD))}
                >
                  Use declined test card
                </button>
              </div>
              <p className="card-summary">
                {digits.length >= 4 ? (
                  <>
                    Card ending in <strong>{digits.slice(-4)}</strong>
                  </>
                ) : (
                  <span className="muted">No card entered yet</span>
                )}
                {digits.endsWith('0002') && (
                  <span className="muted"> · this test card will be declined</span>
                )}
              </p>
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>

        <aside className="panel" aria-label="Order summary">
          <h2>Order summary</h2>
          {previewError && <p className="error">{previewError}</p>}
          {!preview && !previewError && <Spinner centered label="Loading prices" />}
          {preview?.items.map((l) => (
            <div key={l.offer_id} className="summary-item">
              {l.product ? (
                <Cover name={l.product.name} color={l.product.cover_color} thumb />
              ) : (
                <span />
              )}
              <div>
                <p className="small muted" style={{ margin: 0 }}>
                  Sold by <strong>{l.seller?.name ?? '-'}</strong>
                </p>
                <strong>{l.product?.name ?? 'Unavailable offer'}</strong>
                <p className="small muted" style={{ margin: '2px 0 0' }}>
                  Quantity: {l.quantity}
                </p>
              </div>
              <strong>{formatPrice(l.line_total)}</strong>
            </div>
          ))}
          {preview?.items.some((l) => !l.available) && (
            <p className="error">
              Some items are no longer available.{' '}
              <Link to="/cart" className="link">
                Fix your cart
              </Link>
            </p>
          )}
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(preview?.total ?? 0)}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span className="price big">{formatPrice(preview?.total ?? 0)}</span>
          </div>
          <button
            className="btn btn-block btn-lg pay-button"
            type="submit"
            disabled={paying || blocked}
          >
            {paying ? 'Processing...' : `Pay ${formatPrice(preview?.total ?? 0)}`}
          </button>
          <p className="muted small" style={{ marginTop: 12 }}>
            This is a demo: payments are simulated and no real money is charged.
          </p>
        </aside>
      </form>
    </div>
  )
}

export default Checkout
