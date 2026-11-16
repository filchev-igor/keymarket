import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../cart'
import { formatPrice } from '../format'
import type { Product } from '../types'

/**
 * Generated cover (no copyrighted images): a gradient from the product's colour, with its name drawn on it.
 * A product card turns the name off (`showTitle={false}`) because the card already prints the title below the image.
 */
export const Cover = ({
  name,
  color,
  thumb = false,
  showTitle = true,
}: {
  name: string
  color: string
  thumb?: boolean
  showTitle?: boolean
}) => {
  return (
    <div
      className={`cover${thumb ? ' thumb' : ''}`}
      style={{
        background: `radial-gradient(circle at 25% 15%, ${color}, transparent 70%), linear-gradient(160deg, ${color}, #12082b)`,
      }}
    >
      {showTitle && <span className="cover-title">{name}</span>}
    </div>
  )
}

const ProductCard = ({ product }: { product: Product }) => {
  const cart = useCart()
  const [added, setAdded] = useState(false)
  const url = `/product/${product.slug}`

  // The hover button buys the cheapest in-stock offer (the one whose price is shown on the card).
  const add = () => {
    if (product.best_offer_id === null) return
    cart.add(product.best_offer_id)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="card">
      <Link to={url} className="card-link">
        <div className="card-media">
          <Cover name={product.name} color={product.cover_color} showTitle={false} />
          {/* Teal tag: the real discount of the cheapest offer (there is no cashback feature in this demo) */}
          {product.discount_percent ? (
            <span className="tag-teal">SALE -{product.discount_percent}%</span>
          ) : null}
        </div>
        <div className="platform-strip">{product.platform}</div>
        <div className="card-body">
          <h3 title={product.name}>{product.name}</h3>
          <p className="region">{product.region}</p>
          {product.price === null ? (
            <p className="muted small">Out of stock</p>
          ) : (
            <div className="price-block">
              {/* "From" line with the struck-through old price and the discount, then the big price, then the saving */}
              <span className="price-from">
                From
                {product.old_price && <s>{formatPrice(product.old_price)}</s>}
                {product.discount_percent ? (
                  <span className="pct">-{product.discount_percent}%</span>
                ) : null}
              </span>
              <strong className="price">{formatPrice(product.price)}</strong>
              {product.old_price && (
                <span className="save">Save {formatPrice(product.old_price - product.price)}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Shown on hover or keyboard focus (devices with a mouse); touch users open the card instead */}
      {product.best_offer_id !== null && (
        <div className="card-hover">
          <div className="card-hover-content">
            <button type="button" className="btn btn-block" onClick={add}>
              {added ? 'Added ✓' : 'Add to cart'}
            </button>
            <Link to={url} className="view-offers">
              View offers
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductCard
