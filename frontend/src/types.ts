// Response shapes from the API. The contract lives in /API.md.

export interface User {
  id: number
  name: string
  email: string
}

export interface Product {
  id: number
  slug: string
  name: string
  platform: string
  region: string
  genre: string
  cover_color: string
  best_offer_id: number | null // the cheapest in-stock offer: what "Add to cart" on a card buys
  price: number | null
  old_price: number | null
  discount_percent: number | null
  offers_count: number
}

export interface Offer {
  id: number
  price: number
  old_price: number | null
  stock: number
  seller: { id: number; name: string; rating: number }
}

export interface ProductDetail extends Product {
  description: string
  release_date: string | null
  offers: Offer[]
}

export interface Banner {
  id: number
  title: string
  subtitle: string | null
  color: string
  link: string
}

export interface Paginated<T> {
  data: T[]
  meta: { page: number; per_page: number; total: number; last_page: number }
}

export interface Filters {
  platforms: string[]
  regions: string[]
  genres: string[]
  price: { min: number; max: number }
}

export interface ProductRef {
  id: number
  slug: string
  name: string
  platform: string
  region: string
  cover_color: string
}

export interface CartLine {
  offer_id: number
  quantity: number
  unit_price: number | null
  line_total: number
  available: boolean
  product: ProductRef | null
  seller: { id: number; name: string } | null
}

export interface CartPreview {
  items: CartLine[]
  total: number
  currency: string
}

export interface OrderSummary {
  id: number
  total: number
  currency: string
  created_at: string
  items_count: number
}

export interface Order {
  id: number
  total: number
  currency: string
  created_at: string
  items: {
    product: ProductRef
    seller: { id: number; name: string }
    unit_price: number
    key: string
  }[]
}
