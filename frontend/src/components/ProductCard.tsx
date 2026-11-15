import { Link } from 'react-router-dom'
import { formatPrice } from '../format'
import type { Product } from '../types'

/** Generated cover (no copyrighted images): a gradient from the product's colour with its name. */
export function Cover({ name, color, chip }: { name: string; color: string; chip?: string }) {
  return (
    <div className="cover" style={{ background: `radial-gradient(circle at 20% 15%, ${color}, transparent 70%), linear-gradient(160deg, ${color}, #0d0620)` }}>
      {chip && <span className="chip">{chip}</span>}
      <span className="cover-title">{name}</span>
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.slug}`} className="card">
      <Cover name={product.name} color={product.cover_color} chip={product.platform} />
      {product.discount_percent ? <span className="discount">-{product.discount_percent}%</span> : null}
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="muted small">{product.region} · {product.genre}</p>
        {product.price === null ? (
          <p className="muted">Out of stock</p>
        ) : (
          <div className="price-block">
            {product.old_price && <s className="muted small">{formatPrice(product.old_price)}</s>}
            <span className="muted small">From</span>
            <strong className="price">{formatPrice(product.price)}</strong>
          </div>
        )}
      </div>
    </Link>
  )
}
