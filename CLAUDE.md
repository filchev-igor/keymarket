# Project rules

## Project
Eneba intern assignment (see assignment.pdf). Repository: `keymarket`. Monorepo: `backend/` (Laravel, PHP, Postgres) and `frontend/` (Vite + React + TypeScript).
Chosen services: **Supabase** (Postgres database only, the backend stays Laravel), **Render** (Laravel backend, Docker), **Vercel** (frontend).
Environment: Windows, PowerShell, PHP 8.5 (C:\php, with pdo_pgsql), Composer 2.8, Node, `git push` works over SSH without prompts, `gh` (GitHub CLI) is logged in.
Scope must be small and focused: the purchase flow must work end to end before anything else.

## Language
Everything for this assignment is in English: your replies to me in this chat (even if I write in another language), code, comments, variable names, commit messages, branch names, PR titles and descriptions, UI texts, seed data, API responses, README and DEPLOY.md. The chat log will be read by the Eneba team.

## How to work
- Start with a short plan (what to build, what to cut, one line of justification per cut). Wait for my approval, then work through the four parts below in order.
- Ask me questions before starting if anything is unclear, and during the process.
- Work in small steps. Explain briefly what you do and why: I must be able to explain all the code.
- Priorities: (1) working purchase flow end to end (browse, product with seller offers, cart, simulated payment, digital key), (2) public deployed URLs, (3) Eneba look, (4) extras.
- Prefer the simplest approach everywhere. Use Laravel Sanctum token auth for the API.
- Do not maintain a conversation log file. I will export the session myself.

## The four parts
**Part 1: Code (backend + frontend, functional).** Laravel API, data model, seeders, auth, catalog with filters (platform, region, price), sorting and name search, homepage blocks (each block from its own endpoint, nothing hardcoded in the frontend), typo-tolerant search (Postgres pg_trgm), product page with offers from several sellers, cart, simulated checkout that issues a unique digital key, order history for signed-in users. Include a `Dockerfile` and `GET /api/health`. Write `API.md` (endpoints and response formats) first, then build backend and frontend against it. You may split Part 1 into several branches (for example backend first, then frontend).
**Part 2: Styling.** Eneba look and feel, see Styling.
**Part 3: Deployment.** Supabase + Render + Vercel, guided step by step, see Deployment.
**Part 4: Tests.** Only for the important parts, see Testing.

If time runs short, cut styling polish and extras first. Never cut the purchase flow or deployment.

## Git workflow
- Never commit directly to `main`, except the very first setup commit that already exists. Every feature is developed in its own branch named `K-N-short-name` with N counting up: `K-1-core-app`, `K-2-styling`, `K-3-deployment`, `K-4-tests`, and `K-5-...` and onwards if more are needed.
- Make as many small commits in the branch as needed, with short conventional messages (`feat:`, `fix:`, `chore:`).
- When the work in the branch is done, push it and open a pull request into `main` with `gh pr create`. The PR title is `K-N: <meaningful description of what was done>` and the body is a short summary (what was done, what was deliberately simplified).
- Before merging, tell me the PR is ready and wait for my quick OK. Then merge with `gh pr merge <number> --squash` (Squash and merge: one commit on `main`). Never use `--delete-branch`: the branches and their commits must stay visible. Then `git checkout main`, `git pull`, and create the next branch from the updated `main`.
- Git authentication over SSH works without prompts and `gh` is logged in. If a git or gh command asks for credentials or fails to authenticate, stop and tell me. Never ask me to paste passwords or tokens into the chat.

## What never goes into git
- Never commit `.idea/`, `.vscode/`, `.claude/`, `export/`, `node_modules/`, `vendor/`, `dist/`, or any real `.env` file. Only `.env.example` files with variable names are allowed.
- Keep the root `.gitignore` up to date. Before every commit, run `git status` and check the list of files. Add files explicitly (for example `git add backend frontend docs`), do not use `git add .` blindly. If an unwanted file is already tracked, remove it with `git rm --cached` and tell me.
- If you ever see a secret (password, token, connection string) in a tracked file or in the git history, stop and tell me immediately.

## Environment and secrets
- Keep `.env.example` in `backend/` and `frontend/` with variable names only, no values. Real `.env` files are gitignored: verify this before the first commit.
- All environment-specific values (API URL, CORS origin, database) come from env variables from the start. Seeders must be production-ready (products, offers, keys, a demo user).
- Never print or request secrets. Tell me which variables to set manually in Render and Vercel and what each is for. `VITE_` variables are public: no secrets there.

## Manual steps: tell me what to do
Some things only I can do (create accounts, enter secrets, take screenshots). Whenever such a step is needed, print a block titled **ACTION NEEDED FROM YOU** with a numbered checklist: exactly what to click or type, where, and what to send back to you. Then STOP and wait until I confirm. Do not continue by guessing.
Remind me proactively at these moments:
1. **Before Part 1 needs the database:** I create a Supabase project and copy its connection details into `backend/.env` myself (never into the chat).
2. **Start of Part 2:** I take screenshots of eneba.com (home, store, product page, cart) into `design/` and send DevTools Computed values, or I tell you to skip it.
3. **Start of Part 3:** I create Render and Vercel accounts (sign in with GitHub) and I enter all env variables myself in their panels.
4. **After deployment:** I open the Render URL once to wake the service before testing.
5. **At the very end:** I export the chat and send the email (see Final verification).

## Database (Supabase)
- Use Supabase only as hosted Postgres. Enable `pg_trgm` with a migration (`CREATE EXTENSION IF NOT EXISTS pg_trgm`).
- Render's free tier may not reach Supabase's direct connection (IPv6 only). If the connection fails from Render, use the **pooler connection string (Session mode)** instead and tell me where to find it in the Supabase dashboard (Project Settings, Database, Connection string). Set `DB_CONNECTION=pgsql` and `DB_SSLMODE=require`.
- Never commit the connection string.

## Styling (Part 2)
Reference: https://www.eneba.com. Brand primary color is #4618AC (from the site's theme-color meta tag). Fetching the site only returns text, not CSS, so I must provide visuals if I want precision.
- If screenshots are in `design/`, read them and extract colors, fonts, spacing, card and button styles into CSS variables (design tokens), then apply them to every screen.
- If there are no screenshots, build a clean dark-purple marketplace look from #4618AC: rounded product cards, a header with a placeholder logo, search bar, cart icon and sign-in links.
- Do not copy Eneba's logo, images or code: use a placeholder wordmark and my own assets.

## Deployment (Part 3)
Write a step-by-step guide to `DEPLOY.md` and walk me through it one step at a time, waiting for my confirmation after each step. Include exact click paths, exact variable names, and what to copy back to you. Cover:
1. **Supabase:** project created, connection details in local `backend/.env`, migrations and seeders run locally against it.
2. **Render:** create a Web Service from the GitHub repo, root directory `backend/`, runtime Docker. Set env variables manually (name and purpose of each): `APP_KEY` (generate with `php artisan key:generate --show`), `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, DB settings, frontend URL for CORS. Run migrations and seeders on deploy (for example in the Docker entrypoint).
3. **Vercel:** import the repo, Root Directory `frontend/`, framework Vite, set `VITE_API_URL` to the Render URL, deploy. Add SPA rewrites so refreshing a route does not 404.
4. **CORS:** add the Vercel URL to the backend CORS config and env, redeploy the backend.
5. **Live check:** register, sign in, browse, search with a typo, open a product, add to cart, pay, receive the key, see the order.
README must note that the free Render service sleeps and the first request can be slow.

## Testing (Part 4)
Only focused tests, no coverage for its own sake: Laravel feature tests for auth (register, sign in, protected routes), catalog filter and search (including a typo), and checkout (issues a unique key, a key is never sold twice, guests cannot check out). Use a separate test database (SQLite in memory is fine for tests where pg_trgm is not needed) and make sure `php artisan test` passes from scratch. No frontend tests. Document in README what was cut or left untested, and why.

## README
Must include: how to run locally, architecture and data model overview, what was built, what was deliberately cut or left untested and why, live URLs, a demo account (email and password of the seeded user), and a note that payment is simulated and no real money is involved.

## Final verification (last step, go through it with me)
1. `php artisan test` passes from scratch.
2. No secrets in the repo: `.env` is ignored, only `.env.example` files with names are committed (`git ls-files | findstr env`).
3. Live URLs work: register, sign in, browse and filter, search with a typo, product with several offers, cart, pay, receive the key, order history, a protected page while signed out.
4. README is complete (see README section). The repo is public, or tell me if it should stay private.
5. Remove leftovers: test files, debug output, unused code.
6. Remind me to EXPORT THE FULL CHAT HISTORY of this whole work (prompts and responses, unedited): try `/export` in Claude Code (check `/help` if the command differs), save it as `docs/ai-log.md`, commit and push it through a branch and PR like everything else. Review it for secrets first. If the work was split across several sessions, export each one.
7. Remind me what to send to internship@eneba.com: my full name, the GitHub link(s), the public URL, the chat history file (or link), and my CV in English.

## When to run checks
- Do not run the backend test suite at any point unless I write "final check". It takes about 5 minutes.
- Frontend: run the type-check and production build once before opening a PR, never between commits.
- If you change anything under backend/, say so clearly in the PR description and ask me before merging, so I can decide whether to run the tests.
- When I write "final check": run once from scratch the full backend test suite plus the frontend type-check and build, and report the result.
- After merging, tell me to confirm the Vercel and Render deploys and a quick live check.

## Design references
- Do not read or take screenshots unless the user asks. Use the .md files in design/ instead.