import { useEffect, useState } from 'react'
import { api } from './api'
import { useCart } from './cart'
import type { CartPreview } from './types'

/** Loads current prices and availability for the cart from the server. */
export const useCartPreview = () => {
  const { items } = useCart()
  const empty = items.length === 0
  const [preview, setPreview] = useState<CartPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(items)

  // An empty cart has no prices. Dropping the old ones while rendering (the pattern React recommends for
  // resetting state) avoids setting state synchronously inside the effect.
  if (empty && preview !== null) setPreview(null)

  useEffect(() => {
    if (empty) return
    let cancelled = false
    api<CartPreview>('/cart/preview', { method: 'POST', body: { items } })
      .then((p) => !cancelled && setPreview(p))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the serialised `items`
  }, [key])

  return { preview, error }
}
