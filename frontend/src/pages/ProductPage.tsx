import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFetch } from '../api'
import { useCart } from '../cart'
import { Cover } from '../components/ProductCard'
import Status from '../components/Status'
import { formatPrice } from '../format'
import type { ProductDetail } from '../types'

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

  return (
    <div className="container stack">
      <div className="product-head">
        <Cover name={product.name} color={product.cover_color} />
        <div>
          <h1>{product.name}</h1>
          <p className="muted">
            {product.platform} · {product.region} · {product.genre}
            {product.release_date && ` · Released ${new Date(product.release_date).getFullYear()}`}
          </p>
          <p>{product.description}</p>
          {product.price !== null && (
            <p className="price-row">
              {product.old_price && <s className="muted">{formatPrice(product.old_price)}</s>}
              <strong className="price big">From {formatPrice(product.price)}</strong>
              {product.discount_percent ? <span className="discount inline">-{product.discount_percent}%</span> : null}
            </p>
          )}
        </div>
      </div>

      <section>
        <h2>Offers from {product.offers.length} sellers</h2>
        {product.offers.length === 0 && <p>This product is currently out of stock.</p>}
        <div className="offers">
          {product.offers.map((offer, i) => (
            <div key={offer.id} className="offer">
              <div>
                <strong>{offer.seller.name}</strong> {i === 0 && <span className="tag">Best price</span>}
                <p className="muted">★ {offer.seller.rating.toFixed(1)} · {offer.stock} keys in stock</p>
              </div>
              <div className="price-row">
                {offer.old_price && <s className="muted">{formatPrice(offer.old_price)}</s>}
                <strong className="price">{formatPrice(offer.price)}</strong>
              </div>
              <div className="actions">
                <button
                  className="btn"
                  onClick={() => {
                    cart.add(offer.id)
                    setAdded(offer.id)
                  }}
                >
                  {added === offer.id ? 'Added ✓' : 'Add to cart'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    cart.add(offer.id)
                    navigate('/cart')
                  }}
                >
                  Buy now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
