import { Link } from 'react-router-dom'
import { formatPrice } from '../format'
import type { Product } from '../types'

/** Generated cover (no copyrighted images): a gradient from the product's colour with its name. */
export function Cover({ name, color }: { name: string; color: string }) {
  return (
    <div className="cover" style={{ background: `linear-gradient(135deg, ${color}, #12082b)` }}>
      <span>{name}</span>
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.slug}`} className="card">
      <Cover name={product.name} color={product.cover_color} />
      {product.discount_percent ? <span className="discount">-{product.discount_percent}%</span> : null}
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="muted">
          {product.platform} · {product.region}
        </p>
        <p className="price-row">
          {product.old_price && <s className="muted">{formatPrice(product.old_price)}</s>}
          <strong className="price">{product.price === null ? 'Out of stock' : `From ${formatPrice(product.price)}`}</strong>
        </p>
      </div>
    </Link>
  )
}
