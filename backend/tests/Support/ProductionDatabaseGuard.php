<?php

namespace Tests\Support;

use Dotenv\Dotenv;
use Illuminate\Foundation\Application;
use RuntimeException;

/**
 * Safety net: the feature tests use RefreshDatabase, which WIPES the database it runs on.
 * This guard makes the test run refuse to start when the test database could be the real (production) one.
 *
 * It compares the test connection with the one in backend/.env (what the app and the dev server use).
 * Two Supabase projects in the same region share the same pooler host, so the host alone cannot tell
 * them apart: the project is identified by its "ref", found in the username (postgres.<ref>) or in a
 * direct host (db.<ref>.supabase.co). When in doubt, it refuses.
 */
final class ProductionDatabaseGuard
{
    private const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

    /** Called from TestCase::createApplication(), i.e. before RefreshDatabase can touch any database. */
    public static function assertSafe(Application $app): void
    {
        if (! file_exists($app->basePath('.env.testing'))) {
            // Without it Laravel silently falls back to .env, which is the production database.
            throw new RuntimeException(
                'Refusing to run tests: backend/.env.testing does not exist. Copy .env.testing.example to '.
                '.env.testing and point it at a separate test database (never the production one).'
            );
        }

        $default = $app['config']->get('database.default');
        $connection = $app['config']->get("database.connections.$default", []);

        $violation = self::violation(
            [
                'driver' => $connection['driver'] ?? null,
                'url' => $connection['url'] ?? null,
                'host' => $connection['host'] ?? null,
                'username' => $connection['username'] ?? null,
                'database' => $connection['database'] ?? null,
            ],
            self::productionSettings($app->basePath('.env')),
        );

        if ($violation !== null) {
            throw new RuntimeException('Refusing to run tests: '.$violation.' (tests wipe their database).');
        }
    }

    /**
     * Pure decision function (unit-tested). Returns why the test database must NOT be used, or null if it is safe.
     *
     * @param  array{driver?: ?string, url?: ?string, host?: ?string, username?: ?string, database?: ?string}  $test
     * @param  array{host?: ?string, username?: ?string, database?: ?string}|null  $production  null = no .env to compare with
     */
    public static function violation(array $test, ?array $production): ?string
    {
        if (($test['driver'] ?? null) !== 'pgsql') {
            return 'tests must run on the pgsql connection (got "'.($test['driver'] ?? 'none').'")';
        }
        if (! empty($test['url'])) {
            return 'DB_URL is set; configure the test database with DB_HOST/DB_USERNAME/... in .env.testing instead';
        }

        $host = self::normalise($test['host'] ?? null);
        if ($host === '') {
            return 'no test database host is configured';
        }

        $prodHost = self::normalise($production['host'] ?? null);
        if ($prodHost === '') {
            // Nothing to compare with (for example in CI): only a local database is provably not production.
            return in_array($host, self::LOCAL_HOSTS, true)
                ? null
                : 'there is no backend/.env to compare against, so only a local test database is allowed';
        }

        $user = self::normalise($test['username'] ?? null);
        $prodUser = self::normalise($production['username'] ?? null);
        $testRef = self::projectRef($host, $user);
        $prodRef = self::projectRef($prodHost, $prodUser);

        if ($testRef !== null && $prodRef !== null) {
            return $testRef === $prodRef ? 'the test database is the same Supabase project as the production database' : null;
        }

        // Project identity unknown on at least one side: same host and same database name is too risky.
        if ($host === $prodHost && self::normalise($test['database'] ?? null) === self::normalise($production['database'] ?? null)) {
            return 'the test database has the same host and database name as the production database';
        }

        return null;
    }

    /** Supabase project ref from "postgres.<ref>" (pooler user) or "db.<ref>.supabase.co" (direct host). */
    public static function projectRef(string $host, string $username): ?string
    {
        if (preg_match('/^postgres\.([a-z0-9]+)$/', $username, $m)) {
            return $m[1];
        }
        if (preg_match('/^db\.([a-z0-9]+)\.supabase\.co$/', $host, $m)) {
            return $m[1];
        }

        return null;
    }

    /** Reads the production connection from the .env FILE (not from process env, which tests override). */
    private static function productionSettings(string $envFile): ?array
    {
        if (! is_file($envFile)) {
            return null;
        }
        $values = Dotenv::parse((string) file_get_contents($envFile));

        return [
            'host' => $values['DB_HOST'] ?? null,
            'username' => $values['DB_USERNAME'] ?? null,
            'database' => $values['DB_DATABASE'] ?? null,
        ];
    }

    private static function normalise(?string $value): string
    {
        return strtolower(trim((string) $value));
    }
}
