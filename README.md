# keymarket

A small game-key marketplace in the style of Eneba, built as an internship assignment: browse a catalog, compare offers from several sellers, put keys in a cart, pay (simulated) and receive a unique digital key.

> **Demo project.** Games, sellers and keys are fictional, and any resemblance to real products is coincidental. Not affiliated with any game platform or store. Payments are simulated. Please do not enter real personal data.

## Live demo

- App: https://keymarket-eta.vercel.app
- API: https://keymarket-api-d5bt.onrender.com (`/api/health`)
- Demo account: `demo@keymarket.test` / `demo1234` (or register your own)

The API runs on Render's **free tier, which sleeps after about 15 minutes without traffic**. The first request after that can take 30-60 seconds; open the health URL once to wake it up.

Payment is **simulated and no real money is involved**: any 12-19 digit card number is accepted, except one ending in `0002`, which is declined to show the failure path.

## What was built

- **Store:** every product, filters (platform, region, genre, price), sorting, pagination, name search.
- **Search:** available from the header on every page; typo-tolerant and partial-name (`pg_trgm`), e.g. `cyber dirft` finds "Cyber Drift 2077".
- **Homepage:** banners, best sellers and deals, each loaded from its own API endpoint; nothing is hardcoded in the frontend.
- **Product page:** details plus offers from several sellers, cheapest first.
- **Cart and checkout:** cart kept in the browser, priced by the server; checkout requires sign-in and issues one unique key per purchased unit in a single transaction (a key is never sold twice).
- **Auth:** register, sign in, sign out with Laravel Sanctum tokens; checkout and order history are protected.
- **Order history:** every order with its keys.
- **Styling:** dark-purple marketplace look from design tokens (CSS variables) based on the brand colour `#4618AC`. No Eneba screenshots were used, so it is a close-in-spirit look, not a pixel copy; no Eneba logo, images or code are used.

API contract: [`API.md`](API.md). Deployment guide: [`DEPLOY.md`](DEPLOY.md).

## Architecture

```
React + TypeScript (Vite)  --HTTPS/JSON-->  Laravel API (Docker)  --SQL-->  Postgres (Supabase)
        Vercel                                    Render                      pg_trgm enabled
```

- `backend/`: Laravel 13 API. Controllers stay thin; checkout logic is in `app/Services/CheckoutService.php`, the fake payment in `PaymentSimulator.php`.
- `frontend/`: Vite + React + TypeScript, React Router, plain CSS. State is two small contexts (auth, cart) and a `useFetch` hook; no state library.
- Money is stored and sent as integer cents.

### Data model

| Table | Purpose |
|---|---|
| `users` | Accounts (Sanctum tokens in `personal_access_tokens`) |
| `products` | A game on one platform/region (name, platform, region, genre, cover colour, units sold) |
| `sellers` | Fictional sellers with a rating |
| `offers` | One seller's price for one product (`old_price` marks a discount) |
| `game_keys` | The digital keys. Stock of an offer = its keys not yet attached to an order item; `code` is unique |
| `orders`, `order_items` | A purchase and its lines; each line owns exactly one key |
| `banners` | Homepage banners |

Seeders are idempotent: running them again never duplicates products, offers or keys, and never restores keys that were sold.

## Run locally

Requirements: PHP 8.3+ with `pdo_pgsql`, Composer, Node 20+, and a Postgres database with the `pg_trgm` extension (a free Supabase project works).

```bash
# Backend
cd backend
composer install
cp .env.example .env          # then fill in the DB_* values and FRONTEND_URL
php artisan key:generate
php artisan migrate --seed
php artisan serve             # http://localhost:8000

# Frontend (second terminal)
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npm run dev                   # http://localhost:5173
```

## Deliberately simplified

- Payment is simulated; there is no payment provider and no card data is stored.
- No admin panel or seller dashboard: sellers, offers and keys come from seeders.
- No email verification, password reset or social login.
- The cart lives in the browser (localStorage); the server only prices it.
- Game covers are generated gradients, not images.
- The API runs on PHP's built-in server inside Docker, which is enough for a free-tier demo.
- The Eneba look is approximated without screenshots.

## Privacy note

The site loads nothing from third parties (no analytics, trackers, CDN or web fonts) and sets no cookies. The browser stores two things in `localStorage`: the sign-in token and the cart. The hosting providers (Vercel, Render, Supabase) see request metadata such as IP addresses, as any host does.
