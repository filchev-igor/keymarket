#!/bin/sh
set -e

# Runs on every container start: create/upgrade tables, seed demo data (the seeder is idempotent).
php artisan migrate --force
php artisan db:seed --force

# Render provides $PORT; default to 8000 for local Docker runs.
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
