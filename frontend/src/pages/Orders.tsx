import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api'
import Status from '../components/Status'
import { formatDate, formatPrice } from '../format'
import type { Order, OrderSummary } from '../types'

export function OrderList() {
  const { data, loading, error } = useFetch<{ data: OrderSummary[] }>('/orders')
  return (
    <div className="container stack">
      <h1>My orders</h1>
      <Status loading={loading} error={error} />
      {data?.data.length === 0 && (
        <p>No orders yet. <Link to="/store">Find your first game</Link></p>
      )}
      {data?.data.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="cart-line compact">
          <span>Order #{o.id} <span className="muted">· {formatDate(o.created_at)} · {o.items_count} key(s)</span></span>
          <strong>{formatPrice(o.total)}</strong>
        </Link>
      ))}
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const { data, loading, error } = useFetch<{ data: Order }>(`/orders/${id}`)
  const order = data?.data

  return (
    <div className="container stack">
      <Status loading={loading} error={error} />
      {order && (
        <>
          <h1>Order #{order.id}</h1>
          <p className="notice">Thank you! Your digital keys are below. (Payment was simulated, no real money was charged.)</p>
          <p className="muted">{formatDate(order.created_at)} · Total {formatPrice(order.total)}</p>
          {order.items.map((item, i) => (
            <div key={i} className="key-card">
              <div>
                <strong>{item.product.name}</strong>
                <p className="muted">{item.product.platform} · {item.product.region} · sold by {item.seller.name} · {formatPrice(item.unit_price)}</p>
              </div>
              <code className="key">{item.key}</code>
            </div>
          ))}
          <Link to="/orders">Back to all orders</Link>
        </>
      )}
    </div>
  )
}
