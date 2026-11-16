# Deploying keymarket

Three free services, each doing one job:

| Part | Service | What runs there |
|---|---|---|
| Database | **Supabase** | Postgres only (the backend stays Laravel) |
| Backend | **Render** | The Laravel API, built from `backend/Dockerfile` |
| Frontend | **Vercel** | The React app (static build of `frontend/`) |

Order matters: **Supabase → Render → Vercel → back to Render (CORS) → live check.**
Never paste passwords, keys or connection strings into git, chat or the README. Values go only into local
`backend/.env` (gitignored) and into the Render / Vercel dashboards.

---

## 0. Before you start

- The code must be on `main` on GitHub (Render and Vercel build from it).
- You need free accounts on Render and Vercel. Sign in with GitHub on both.

---

## 1. Supabase (database)

The project already exists and `backend/.env` points at it. Check it works from your machine:

```powershell
cd backend
php artisan migrate:status     # all migrations should say "Ran"
php artisan db:seed --force    # safe to repeat: it never duplicates products or keys
```

Connection details come from Supabase: **Project Settings → Database → Connection string**.
Use the **Session pooler** string (host looks like `aws-0-xx.pooler.supabase.com`, user is
`postgres.<project-ref>`). Render's free tier cannot reach the direct connection (IPv6 only).

You will copy these values into Render in step 2: host, port, database, user, password.

---

## 2. Render (backend API)

### 2.1 Generate the app key (locally)

```powershell
cd backend
php artisan key:generate --show
```

It prints one line starting with `base64:`. Copy it for the `APP_KEY` variable below.
(`--show` only prints it, it does not change any file.)

### 2.2 Create the Web Service

1. Go to https://dashboard.render.com and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Choose **Build and deploy from a Git repository** → **Next**.
4. Connect GitHub if asked, then pick the **`keymarket`** repository → **Connect**.
5. Fill in the form:
   - **Name:** `keymarket-api` (this decides the URL: `https://keymarket-api.onrender.com`; if the name is taken, use another and use that URL below)
   - **Region:** the one closest to your Supabase region
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Language / Runtime:** `Docker` (it finds `backend/Dockerfile` by itself)
   - **Instance Type:** `Free`
6. Open **Advanced** and set **Health Check Path** to `/api/health`.
7. Add the **Environment Variables** (below), then click **Deploy Web Service**.

### 2.3 Environment variables

| Name | Value | What it is for |
|---|---|---|
| `APP_NAME` | `keymarket` | App name in logs |
| `APP_ENV` | `production` | Production mode |
| `APP_DEBUG` | `false` | Never show stack traces to visitors |
| `APP_KEY` | the `base64:...` from 2.1 | Encryption key (required, keep secret) |
| `APP_URL` | `https://keymarket-api.onrender.com` | The API's own public URL |
| `FRONTEND_URL` | `http://localhost:5173` for now | Allowed browser origin for CORS. **Replaced in step 4** with the Vercel URL. Several origins: separate with commas |
| `LOG_CHANNEL` | `stderr` | Logs show up in Render's Logs tab |
| `LOG_LEVEL` | `info` | Log verbosity |
| `DB_CONNECTION` | `pgsql` | Database driver |
| `DB_HOST` | pooler host from Supabase | Database server |
| `DB_PORT` | `5432` | Session pooler port |
| `DB_DATABASE` | `postgres` | Database name |
| `DB_USERNAME` | `postgres.<project-ref>` | Pooler user |
| `DB_PASSWORD` | your Supabase database password | Secret |
| `DB_SSLMODE` | `require` | Supabase requires TLS |
| `SESSION_DRIVER` | `array` | The API is stateless (token auth) |
| `CACHE_STORE` | `file` | No cache table needed |
| `QUEUE_CONNECTION` | `sync` | No queue worker needed |

If a required variable is missing, the container stops immediately and the Render log says which one.

### 2.4 What happens on every start

`backend/docker-entrypoint.sh` runs: `config:cache` → `migrate --force` → `db:seed --force` → web server.
Migrations only apply new changes. The seeder is idempotent (an advisory lock serialises concurrent
starts; products are matched by slug; keys are only created together with a new product), so restarting
or redeploying never duplicates products or keys and never brings back keys that were sold.

### 2.5 Check it

The first build takes roughly 5-10 minutes. When the service says **Live**, open in a browser:

- `https://keymarket-api.onrender.com/api/health` → `{"status":"ok"}`
- `https://keymarket-api.onrender.com/api/home/banners` → three banners

> The free Render service **sleeps after about 15 minutes without traffic**. The first request after
> that can take 30-60 seconds. Open the health URL once to wake it before testing or demoing.

---

## 3. Vercel (frontend)

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Find the **`keymarket`** repository → **Import**.
4. Configure:
   - **Framework Preset:** `Vite` (detected automatically)
   - **Root Directory:** click **Edit**, choose **`frontend`**
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
5. Open **Environment Variables** and add:

   | Name | Value | What it is for |
   |---|---|---|
   | `VITE_API_URL` | `https://keymarket-api.onrender.com` | Where the app finds the API. **No trailing slash, no `/api`.** It is public (it ends up in the browser bundle), so never put secrets in `VITE_` variables |

6. Click **Deploy**. When it finishes, copy the production URL (for example `https://keymarket.vercel.app`).

`frontend/vercel.json` rewrites every path to `index.html`, so refreshing `/store` or `/orders/3` does not 404.
`VITE_API_URL` is baked in at build time: if you change it later, **redeploy** the frontend.

---

## 4. CORS (connect the two)

The browser only lets the frontend call the API if the API allows the frontend's origin.

1. Render dashboard → `keymarket-api` → **Environment**.
2. Change `FRONTEND_URL` to the exact Vercel URL: `https://keymarket.vercel.app`
   (scheme included, **no trailing slash, no path**).
3. **Save, rebuild, and deploy** (or **Save Changes**; Render restarts the service).

Only this production domain is allowed. Vercel preview URLs (one per branch) are different origins and
will be blocked on purpose; to allow another origin add it to `FRONTEND_URL` separated by a comma.

---

## 5. Live check

Open the Vercel URL (after waking the API, see 2.5) and go through:

- [ ] Home shows banners, best sellers and deals
- [ ] Register a new account, sign out, sign in again
- [ ] Store: filter by platform, region and price; change the sort order
- [ ] Search with a typo (for example `cyber dirft` or `zombe harbr`)
- [ ] Open a product: several seller offers are listed
- [ ] Add an offer to the cart, change quantity
- [ ] While signed out, click **Proceed to checkout**: you are sent to sign in first
- [ ] Pay with the prefilled test card: the order page shows the digital key
- [ ] **My orders** lists the order; refreshing the page does not 404
- [ ] A card ending in `0002` is declined and nothing is charged

Demo account (seeded): `demo@keymarket.test` / `demo1234`. Payment is simulated, no real money is involved.

---

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Render log: `environment variable X is not set` | Add `X` in Render → Environment and redeploy |
| Render log: could not connect / network unreachable | You used the direct Supabase host. Use the **Session pooler** host and the `postgres.<project-ref>` user |
| Render log: password authentication failed | Wrong `DB_PASSWORD`/`DB_USERNAME`; reset the DB password in Supabase and update Render |
| Browser console: `blocked by CORS policy` | `FRONTEND_URL` does not exactly match the Vercel origin (trailing slash, `http` vs `https`, wrong domain) |
| Frontend says "Cannot reach the server" | API is asleep (wait and retry) or `VITE_API_URL` is wrong; fix it and redeploy the frontend |
| Frontend calls `localhost:8000` | `VITE_API_URL` was missing at build time; set it and redeploy the frontend |
| Page 404 on refresh | `frontend/vercel.json` missing from the deployed commit, or Root Directory is not `frontend` |
