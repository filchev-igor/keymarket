<?php

namespace Tests\Feature;

use Dotenv\Dotenv;
use Tests\TestCase;

/**
 * Deliberately does NOT use RefreshDatabase and never queries the database.
 * Booting the app already runs ProductionDatabaseGuard (see Tests\TestCase), so if this class gets as far as
 * its assertions, the guard accepted the configuration; the assertions then double-check it independently.
 */
class TestDatabaseSafetyTest extends TestCase
{
    public function test_the_suite_runs_in_the_testing_environment_on_postgres(): void
    {
        $this->assertSame('testing', app()->environment());
        $this->assertSame('pgsql', config('database.default'));
        $this->assertEmpty(config('database.connections.pgsql.url'), 'DB_URL must not override the test host settings');
    }

    public function test_the_test_database_is_not_the_one_in_the_dev_and_production_env_file(): void
    {
        $envFile = base_path('.env');
        if (! is_file($envFile)) {
            $this->markTestSkipped('No backend/.env to compare with (for example on CI).');
        }
        $production = Dotenv::parse((string) file_get_contents($envFile));

        $this->assertNotSame(
            strtolower($production['DB_USERNAME'] ?? ''),
            strtolower((string) config('database.connections.pgsql.username')),
            'The tests are configured with the production database user: fix backend/.env.testing.',
        );
        $this->assertNotSame(
            $production['DB_PASSWORD'] ?? '',
            config('database.connections.pgsql.password'),
            'The tests are configured with the production database password: fix backend/.env.testing.',
        );
    }
}
