import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// The cart is only [{ offer_id, quantity }] kept in localStorage. Prices come from the server (POST /cart/preview).
export interface CartItem {
  offer_id: number
  quantity: number
}

const CART_KEY = 'keymarket_cart'
const MAX_QUANTITY = 10

interface CartState {
  items: CartItem[]
  count: number
  add: (offerId: number) => void
  setQuantity: (offerId: number, quantity: number) => void
  remove: (offerId: number) => void
  clear: () => void
}

const CartContext = createContext<CartState | null>(null)

const load = (): CartItem[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {
      // storage unavailable: the cart just lives until the tab closes
    }
  }, [items])

  const value: CartState = {
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    add: (offerId) =>
      setItems((cur) => {
        const existing = cur.find((i) => i.offer_id === offerId)
        if (!existing) return [...cur, { offer_id: offerId, quantity: 1 }]
        return cur.map((i) =>
          i.offer_id === offerId ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) } : i,
        )
      }),
    setQuantity: (offerId, quantity) =>
      setItems((cur) =>
        cur.map((i) =>
          i.offer_id === offerId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, MAX_QUANTITY)) }
            : i,
        ),
      ),
    remove: (offerId) => setItems((cur) => cur.filter((i) => i.offer_id !== offerId)),
    clear: () => setItems([]),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = (): CartState => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
