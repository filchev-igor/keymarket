import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api'
import { Cover } from '../components/ProductCard'
import Status from '../components/Status'
import Stepper from '../components/Stepper'
import { formatDate, formatPrice } from '../format'
import type { Order, OrderSummary } from '../types'

export const OrderList = () => {
  const { data, loading, error } = useFetch<{ data: OrderSummary[] }>('/orders')
  return (
    <div className="container">
      <div className="panel">
        <h1>My orders</h1>
        <Status loading={loading} error={error} />
        {data?.data.length === 0 && (
          <p>
            No orders yet.{' '}
            <Link to="/store" className="link">
              Find your first game
            </Link>
          </p>
        )}
        <div className="cart-lines">
          {data?.data.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="cart-line compact">
              <span>
                <strong>Order #{o.id}</strong>{' '}
                <span className="muted small">
                  · {formatDate(o.created_at)} · {o.items_count}{' '}
                  {o.items_count === 1 ? 'key' : 'keys'}
                </span>
              </span>
              <strong>{formatPrice(o.total)}</strong>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export const OrderDetail = () => {
  const { id } = useParams()
  const { data, loading, error } = useFetch<{ data: Order }>(`/orders/${id}`)
  const order = data?.data

  return (
    <div className="container">
      <Stepper step={3} />
      <Status loading={loading} error={error} />
      {order && (
        <div className="panel">
          <h1>Order #{order.id}</h1>
          <p className="notice">
            Thank you! Your digital keys are below. (Payment was simulated, no real money was
            charged.)
          </p>
          <p className="muted small">
            {formatDate(order.created_at)} · Total {formatPrice(order.total)}
          </p>
          <div className="cart-lines">
            {order.items.map((item, i) => (
              <div key={i} className="key-card">
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Cover name={item.product.name} color={item.product.cover_color} thumb />
                  <div>
                    <strong>{item.product.name}</strong>
                    <p className="muted small" style={{ margin: '4px 0 0' }}>
                      {item.product.platform} · {item.product.region} · sold by {item.seller.name} ·{' '}
                      {formatPrice(item.unit_price)}
                    </p>
                  </div>
                </div>
                <code className="key">{item.key}</code>
              </div>
            ))}
          </div>
          <p>
            <Link to="/orders" className="link">
              Back to all orders
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
