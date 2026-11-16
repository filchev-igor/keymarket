import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFetch } from '../api'
import { useCart } from '../cart'
import Icon, { platformIcon } from '../components/Icon'
import { Cover } from '../components/ProductCard'
import Status from '../components/Status'
import { formatPrice } from '../format'
import type { Offer, ProductDetail } from '../types'

export default function ProductPage() {
  const { slug } = useParams()
  const { data, loading, error } = useFetch<{ data: ProductDetail }>(`/products/${slug}`)
  const cart = useCart()
  const navigate = useNavigate()
  const [added, setAdded] = useState<number | null>(null)

  if (loading || error) {
    return (
      <div className="container">
        <Status loading={loading} error={error} />
        <Link to="/store">Back to the store</Link>
      </div>
    )
  }
  const product = data!.data
  const [best, ...others] = product.offers

  function add(offer: Offer) {
    cart.add(offer.id)
    setAdded(offer.id)
  }

  function buyNow(offer: Offer) {
    cart.add(offer.id)
    navigate('/cart')
  }

  const offerRow = (offer: Offer, isBest: boolean) => (
    <div key={offer.id} className={`offer${isBest ? ' best' : ''}`}>
      <div className="seller">
        <span className="seller-avatar" aria-hidden="true">
          {offer.seller.name.charAt(0)}
        </span>
        <div>
          <strong>
            {offer.seller.name} {isBest && <span className="tag-teal">Lowest price</span>}
          </strong>
          <span className="muted small">
            <span className="stars">★ {offer.seller.rating.toFixed(1)}</span> · {offer.stock} keys
            in stock
          </span>
        </div>
      </div>
      <div className="price-line">
        {offer.old_price && <s className="old-price">{formatPrice(offer.old_price)}</s>}
        <strong className="price">{formatPrice(offer.price)}</strong>
      </div>
      <div className="actions">
        <button className="btn" onClick={() => add(offer)}>
          {added === offer.id ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <Link to="/store">Store</Link>
        <Link to={`/store?platform=${encodeURIComponent(product.platform)}`}>
          {product.platform}
        </Link>
        <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <div>
          <div className="pdp-head">
            <Cover name={product.name} color={product.cover_color} />
            <div>
              <h1 className="pdp-title">
                {product.name} ({product.platform}) key
              </h1>
              <div className="pdp-meta">
                <span className="chip">{product.platform}</span>
                <span className="chip">{product.region}</span>
                <span className="chip">{product.genre}</span>
                {product.release_date && (
                  <span className="chip">
                    Released {new Date(product.release_date).getFullYear()}
                  </span>
                )}
              </div>
              <p>{product.description}</p>
              {/* Four info rows: icon, bold title, muted description */}
              <ul className="info-rows">
                <li className="info-row">
                  <span className="info-icon">
                    <Icon name="globe" />
                  </span>
                  <div>
                    <strong>{product.region}</strong>
                    <p>
                      {product.region === 'Global'
                        ? 'Can be activated in any region.'
                        : `Meant for the ${product.region} region. Make sure it matches your account before buying.`}
                    </p>
                  </div>
                </li>
                <li className="info-row">
                  <span className="info-icon">
                    <Icon name={platformIcon(product.platform)} />
                  </span>
                  <div>
                    <strong>{product.platform}</strong>
                    <p>Redeem it on {product.platform}.</p>
                  </div>
                </li>
                <li className="info-row">
                  <span className="info-icon">
                    <Icon name="key" />
                  </span>
                  <div>
                    <strong>Activation key</strong>
                    <p>
                      This is a digital key, not a disc. It is shown on your order page once payment
                      is complete.
                    </p>
                  </div>
                </li>
                <li className="info-row">
                  <span className="info-icon">
                    <Icon name="bolt" />
                  </span>
                  <div>
                    <strong>Instant delivery</strong>
                    <p>No waiting: your key appears right after the (simulated) payment.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <section className="offers-panel" id="offers">
            {product.offers.length === 0 ? (
              <>
                <h2 className="subhead">Offers</h2>
                <p>This product is currently out of stock.</p>
              </>
            ) : (
              <>
                <h2 className="subhead">Recommended offer</h2>
                <div className="offers">{offerRow(best, true)}</div>
                {others.length > 0 && (
                  <>
                    <h2 className="subhead">
                      {others.length} other {others.length === 1 ? 'offer' : 'offers'}
                    </h2>
                    <div className="offers">{others.map((o) => offerRow(o, false))}</div>
                  </>
                )}
              </>
            )}
          </section>
        </div>

        {best && (
          <aside className="buybox" aria-label="Purchase">
            <h2>Best price</h2>
            <div className="price-row">
              <strong className="price big">{formatPrice(best.price)}</strong>
              {best.old_price && <s className="old-price">{formatPrice(best.old_price)}</s>}
              {product.discount_percent ? (
                <span className="tag-teal">-{product.discount_percent}%</span>
              ) : null}
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              Sold by {best.seller.name}
            </p>
            {best.old_price && (
              <p className="save" style={{ margin: '6px 0 0' }}>
                You save {formatPrice(best.old_price - best.price)}
              </p>
            )}
            <button className="btn btn-block" onClick={() => add(best)}>
              {added === best.id ? 'Added to cart ✓' : 'Add to cart'}
            </button>
            <button className="btn btn-block btn-outline" onClick={() => buyNow(best)}>
              Buy now
            </button>
            {others.length > 0 && (
              <a href="#offers" className="more-offers">
                + {others.length} more {others.length === 1 ? 'offer' : 'offers'} from{' '}
                {formatPrice(others[0].price)}
              </a>
            )}
            <ul>
              <li>Your key is shown right after payment</li>
              <li>
                Compare {product.offers.length} {product.offers.length === 1 ? 'seller' : 'sellers'}{' '}
                below
              </li>
              <li>Payment is simulated, no real money</li>
            </ul>
          </aside>
        )}
      </div>
    </div>
  )
}
