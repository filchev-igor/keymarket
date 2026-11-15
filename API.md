# keymarket API

REST + JSON. This file is the contract: backend and frontend are both built against it.

## Conventions

- Base path: `/api`. Requests and responses are JSON (`Accept: application/json`).
- Auth: Laravel Sanctum personal access token, sent as `Authorization: Bearer <token>`. Endpoints marked 🔒 need it.
- Money: integer **cents**, plus `"currency": "EUR"` where relevant (single currency). `1999` = 19.99 EUR.
- Timestamps: ISO 8601 UTC strings.
- Pagination: `?page=1&per_page=24` (max 60). Paginated responses look like
  `{ "data": [...], "meta": { "page": 1, "per_page": 24, "total": 120, "last_page": 5 } }`.
- Errors: `{ "message": "Human readable text", "errors": { "field": ["..."] } }` (`errors` only for validation).
  Status codes: `401` not signed in, `404` not found, `409` stock conflict, `422` validation, `402` payment declined.

## Shared shapes

**Product (list item)**
```json
{
  "id": 1,
  "slug": "cyber-drift-2077-steam-global",
  "name": "Cyber Drift 2077",
  "platform": "Steam",
  "region": "Global",
  "genre": "Racing",
  "cover_color": "#4618AC",
  "price": 1999,
  "old_price": 2999,
  "discount_percent": 33,
  "offers_count": 4
}
```
`price` is the cheapest in-stock offer; `old_price` and `discount_percent` come from that offer (both `null` if no discount).
Products with no in-stock offer have `price: null`.

**Offer**
```json
{
  "id": 10,
  "price": 1999,
  "old_price": 2999,
  "stock": 12,
  "seller": { "id": 3, "name": "KeyHaven", "rating": 4.8 }
}
```

**User**: `{ "id": 1, "name": "Demo User", "email": "demo@keymarket.test" }`

## Health

### `GET /api/health`
`200` → `{ "status": "ok" }`

## Auth

### `POST /api/auth/register`
Body: `{ "name": "Ann", "email": "ann@example.com", "password": "secret123" }` (password min 8)
`201` → `{ "user": User, "token": "1|abc..." }` · `422` if email taken / invalid.

### `POST /api/auth/login`
Body: `{ "email": "...", "password": "..." }`
`200` → `{ "user": User, "token": "..." }` · `422` with `{ "message": "Invalid credentials." }` on wrong login.

### `POST /api/auth/logout` 🔒
`204` no body. Revokes the current token.

### `GET /api/auth/me` 🔒
`200` → `{ "user": User }`

## Homepage blocks

Each block is its own endpoint; the frontend renders what it gets and nothing else.

### `GET /api/home/banners`
`200` → `{ "data": [ { "id": 1, "title": "Summer Sale", "subtitle": "Up to 70% off", "color": "#4618AC", "link": "/store?sort=discount" } ] }`
(`link` is a frontend route.)

### `GET /api/home/best-sellers`
`200` → `{ "data": [ Product, ... ] }` (up to 10, ordered by units sold).

### `GET /api/home/deals`
`200` → `{ "data": [ Product, ... ] }` (up to 10, highest discount first, only products with a discount).

## Catalog

### `GET /api/filters`
Values for the store filter UI.
`200` → `{ "platforms": ["Steam", "PlayStation"], "regions": ["Global", "Europe"], "genres": ["Action"], "price": { "min": 99, "max": 7999 } }`

### `GET /api/products`
Query params (all optional):

| Param | Meaning |
|---|---|
| `q` | Name search. Typo-tolerant and partial (Postgres `pg_trgm`). |
| `platform` | Exact platform name. |
| `region` | Exact region name. |
| `genre` | Exact genre. |
| `min_price`, `max_price` | Cents, applied to the cheapest in-stock offer. |
| `sort` | `relevance` (default when `q` is set), `popularity` (default otherwise), `price_asc`, `price_desc`, `discount`, `name`. |
| `page`, `per_page` | Pagination. |

`200` → paginated `{ "data": [ Product, ... ], "meta": {...} }`

### `GET /api/products/{slug}`
`200` →
```json
{
  "data": {
    "id": 1, "slug": "...", "name": "...", "platform": "Steam", "region": "Global",
    "genre": "Racing", "cover_color": "#4618AC", "description": "...",
    "release_date": "2024-05-01",
    "price": 1999, "old_price": 2999, "discount_percent": 33,
    "offers": [ Offer, ... ]
  }
}
```
`offers` are in-stock only, cheapest first. `404` if unknown slug.

## Cart

The cart lives in the browser (localStorage) as `[{ "offer_id": 10, "quantity": 2 }]`. The server only prices it.

### `POST /api/cart/preview`
Body: `{ "items": [ { "offer_id": 10, "quantity": 2 } ] }`
`200` →
```json
{
  "items": [
    {
      "offer_id": 10, "quantity": 2, "unit_price": 1999, "line_total": 3998,
      "available": true,
      "product": { "id": 1, "slug": "...", "name": "...", "platform": "Steam", "region": "Global", "cover_color": "#4618AC" },
      "seller": { "id": 3, "name": "KeyHaven" }
    }
  ],
  "total": 3998,
  "currency": "EUR"
}
```
`available` is `false` if the offer is gone or has less stock than `quantity` (that line is excluded from `total`).

## Checkout and orders

### `POST /api/checkout` 🔒
Body:
```json
{
  "items": [ { "offer_id": 10, "quantity": 2 } ],
  "payment": { "card_number": "4242424242424242" }
}
```
Payment is **simulated**, no real money. Any card number of 12-19 digits is accepted, except one ending in `0002`, which is declined (`402`, `{ "message": "Payment declined." }`) so the failure path can be shown.

In one database transaction the server locks the offers, assigns unused keys (a key can never be sold twice), creates the order and charges nothing.
`201` → `{ "data": Order }` · `409` if stock ran out (`{ "message": "Not enough stock for ..." }`, nothing is changed) · `422` validation.

### `GET /api/orders` 🔒
`200` → `{ "data": [ OrderSummary, ... ] }`, newest first.
`OrderSummary`: `{ "id": 5, "total": 3998, "currency": "EUR", "created_at": "...", "items_count": 2 }`

### `GET /api/orders/{id}` 🔒
Only the owner can read an order (`404` otherwise).
`200` →
```json
{
  "data": {
    "id": 5, "total": 3998, "currency": "EUR", "created_at": "...",
    "items": [
      {
        "product": { "id": 1, "slug": "...", "name": "...", "platform": "Steam", "region": "Global", "cover_color": "#4618AC" },
        "seller": { "id": 3, "name": "KeyHaven" },
        "unit_price": 1999,
        "key": "ABCDE-12345-FGHIJ"
      }
    ]
  }
}
```
One item row per key (quantity 2 gives two rows with two different keys).
