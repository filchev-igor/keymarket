#!/bin/sh
set -e

# Fail fast with a readable message if a required variable was forgotten in the Render dashboard.
for var in APP_KEY DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD FRONTEND_URL; do
    if [ -z "$(printenv "$var")" ]; then
        echo "ERROR: environment variable $var is not set (see DEPLOY.md)." >&2
        exit 1
    fi
done

# Read env vars once at start-up instead of on every request.
php artisan config:cache

# Create/upgrade tables, then seed. Both are safe to run on every start:
# migrate only runs new migrations, and the seeder never duplicates products, offers or keys.
php artisan migrate --force
php artisan db:seed --force

# Render provides $PORT; default to 8000 for local Docker runs.
# PHP_CLI_SERVER_WORKERS lets the built-in server handle several requests at once.
export PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-4}"
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
