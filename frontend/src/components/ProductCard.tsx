import { Link } from 'react-router-dom'
import { formatPrice } from '../format'
import type { Product } from '../types'

/** Generated cover (no copyrighted images): a gradient from the product's colour with its name. */
export function Cover({ name, color, thumb = false }: { name: string; color: string; thumb?: boolean }) {
  return (
    <div
      className={`cover${thumb ? ' thumb' : ''}`}
      style={{ background: `radial-gradient(circle at 25% 15%, ${color}, transparent 70%), linear-gradient(160deg, ${color}, #12082b)` }}
    >
      <span className="cover-title">{name}</span>
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.slug}`} className="card">
      <div className="card-media">
        <Cover name={product.name} color={product.cover_color} />
        {/* Teal tag: the real discount of the cheapest offer (there is no cashback feature in this demo) */}
        {product.discount_percent ? <span className="tag-teal">SALE -{product.discount_percent}%</span> : null}
      </div>
      <div className="platform-strip">{product.platform}</div>
      <div className="card-body">
        <h3 title={product.name}>{product.name}</h3>
        <p className={`region${product.region === 'Global' ? ' global' : ''}`}>{product.region}</p>
        {product.price === null ? (
          <p className="muted small">Out of stock</p>
        ) : (
          <div className="price-block">
            <span className="price-from">From</span>
            <span className="price-line">
              <strong className="price">{formatPrice(product.price)}</strong>
              {product.old_price && <s className="old-price">{formatPrice(product.old_price)}</s>}
            </span>
            {product.old_price && (
              <span className="save">Save {formatPrice(product.old_price - product.price)}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
