# keymarket

A small game-key marketplace in the style of Eneba, built as an internship assignment: browse a catalog, compare offers from several sellers, put keys in a cart, pay (simulated) and receive a unique digital key.

> **Demo project.** Games, sellers and keys are fictional, and any resemblance to real products is coincidental. Not affiliated with any game platform or store. Payments are simulated. Please do not enter real personal data.

## Live demo

- App: https://keymarket-eta.vercel.app
- API: https://keymarket-api-d5bt.onrender.com (`/api/health`)
- Demo account: `demo@keymarket.test` / `demo1234` (or register your own)

The API runs on Render's **free tier, which sleeps after about 15 minutes without traffic**. The first request after that can take up to a minute; open the health URL once to wake it up.

Payment is **simulated and no real money is involved**: any 12-19 digit card number is accepted, except one ending in `0002`, which is declined to show the failure path.

## What was built

- **Store:** every product, filters (platform, region, genre, price), sorting, pagination, name search.
- **Search:** available from the header on every page; typo-tolerant and partial-name (`pg_trgm`), e.g. `cyber dirft` finds "Cyber Drift 2077".
- **Homepage:** banners, best sellers and deals, each loaded from its own API endpoint; nothing is hardcoded in the frontend.
- **Product page:** details plus offers from several sellers, cheapest first.
- **Cart and checkout:** cart kept in the browser, priced by the server; checkout requires sign-in and issues one unique key per purchased unit in a single transaction (a key is never sold twice).
- **Auth:** register, sign in, sign out with Laravel Sanctum tokens; checkout and order history are protected.
- **Order history:** every order with its keys.
- **Styling:** an Eneba-style look driven entirely by design tokens (CSS variables in `frontend/src/index.css`): the purple palette, yellow action buttons, teal tags, type scale, radii and layout proportions were measured from the public site. Header with search and a second navigation row, left filter sidebar, product cards with a platform strip and a teal sale tag, a product page with a right-hand purchase box and a sellers list, a 3-step cart/checkout and a footer, all responsive down to phone width. The font is Montserrat, self-hosted from the npm package `@fontsource-variable/montserrat` (a free font similar to the one the reference uses; nothing is loaded from a CDN). The logo is a placeholder wordmark of our own, covers are generated gradients, and no Eneba logo, images, text or code are used.

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

## Tests

```bash
cd backend
cp .env.testing.example .env.testing   # fill in a SEPARATE Postgres database (a second free Supabase project works)
php artisan test
```

66 backend tests (Laravel feature tests plus unit tests of the safety guard). They run on **Postgres, not SQLite**, because search uses `pg_trgm` and checkout uses `FOR UPDATE SKIP LOCKED`.

**Safety:** the feature tests use `RefreshDatabase`, which wipes the database it runs on. `tests/Support/ProductionDatabaseGuard.php` runs before any test touches a database and refuses to start if `.env.testing` is missing (Laravel would silently fall back to the production `.env`), if the test database is the same Supabase project as the one in `backend/.env` (compared by project ref, because two projects in one region share a pooler host), or if SQLite or `DB_URL` is used. The guard has its own tests, and I checked it by pointing the environment at the production identity and by hiding `.env.testing`: both runs were refused before any database access.

What is covered:
- **Auth:** register (with validation and hashed password), sign in, wrong credentials, `me`, logout revokes the token, protected routes reject guests and invalid tokens.
- **Catalog:** filters (platform, region, genre, price on the cheapest in-stock offer), sorting, pagination, validation, name search including typos and partial names, search combined with filters, product page (in-stock offers, cheapest first, plain 404), the three homepage blocks, filter values.
- **Checkout:** guests cannot check out; one unique key per unit and stock update; duplicate lines merged; several offers per order; **a key is never sold twice** (including a database-level uniqueness check); a **declined card** (`...0002`, in several spellings) creates no order and sells no key; stock errors and a failing second line roll everything back; request validation; orders are private to their buyer; cart pricing.
- A deliberate break of the decline logic makes the decline tests fail, so they do guard that behaviour.

Deliberately **not** tested, and why:
- **Frontend:** no frontend tests (out of scope for this assignment); the UI was checked by hand on the live site.
- **Truly concurrent checkouts:** `SKIP LOCKED` only matters with two simultaneous database connections, which PHPUnit's single-connection tests cannot produce. The tests cover the sequential case and the database unique constraints that back it up.
- **Seeder idempotency, the Docker image and the Render/Vercel deployment:** verified by hand (re-running the seeder against the real database, the live checklist in `DEPLOY.md`), not automated.
- **CORS and the visual design.**
- The suite takes a few minutes because every query goes to a remote database.

## Deliberately simplified

- Payment is simulated; there is no payment provider and no card data is stored.
- No admin panel or seller dashboard: sellers, offers and keys come from seeders.
- No email verification, password reset or social login.
- The cart lives in the browser (localStorage); the server only prices it.
- Game covers are generated gradients, not images.
- The API runs on PHP's built-in server inside Docker, which is enough for a free-tier demo.
- The Eneba look is an approximation: no cashback, wishlist, language switcher or payment-logo strip (those features do not exist here; the teal tag on cards shows the real discount), and the filter sidebar selects one value per group because the API accepts one.

## What I would add next

- **TanStack Query** for server data: caching, request de-duplication and retries, replacing the small hand-written `useFetch` hook.
- **Laravel Pint** to keep the PHP code style consistent automatically.
- **GitHub Actions CI** that runs the backend tests, the frontend type-check and the production build on every pull request.
- **A search suggestions dropdown** under the header search box, on top of the existing typo-tolerant search.

## Process

- **Preparation:** the planning, the environment setup and the project rules in [`CLAUDE.md`](CLAUDE.md) were prepared in a separate Claude chat, before any code was written.
- **Code:** all the code was written by Claude Code in numbered branches, `K-1` to `K-9`, each merged into `main` through a pull request (squash and merge; the branches are kept so the history stays visible). `K-6` was used by two branches (`K-6-cleanup` and `K-6-eneba-styling`) before the automatic branch-numbering rule was added to `CLAUDE.md`; that rule prevents it from happening again.
- **Log:** the full Claude Code log, prompts and responses, is in [`docs/ai-log.md`](docs/ai-log.md).

## Privacy note

The site loads nothing from third parties (no analytics, trackers, CDN or web fonts) and sets no cookies. The browser stores two things in `localStorage`: the sign-in token and the cart. The hosting providers (Vercel, Render, Supabase) see request metadata such as IP addresses, as any host does.
