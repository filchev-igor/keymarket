<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Tests\Support\ProductionDatabaseGuard;

/**
 * No database and no Laravel here: this only checks the rules that stop the test suite
 * from running against the production database. All hosts and refs below are made up.
 */
class ProductionDatabaseGuardTest extends TestCase
{
    private const POOLER = 'aws-0-eu-west-1.pooler.supabase.com';

    private function test(array $overrides = []): array
    {
        return $overrides + ['driver' => 'pgsql', 'url' => '', 'host' => self::POOLER, 'username' => 'postgres.testref', 'database' => 'postgres'];
    }

    private function production(array $overrides = []): array
    {
        return $overrides + ['host' => self::POOLER, 'username' => 'postgres.prodref', 'database' => 'postgres'];
    }

    public function test_a_different_supabase_project_on_the_same_pooler_host_is_allowed(): void
    {
        // Same region = same pooler host; only the project ref in the username differs.
        $this->assertNull(ProductionDatabaseGuard::violation($this->test(), $this->production()));
    }

    public function test_a_different_host_is_allowed(): void
    {
        $this->assertNull(ProductionDatabaseGuard::violation(
            $this->test(['host' => 'aws-0-us-east-1.pooler.supabase.com']),
            $this->production(),
        ));
    }

    public function test_the_same_supabase_project_is_refused_even_with_another_host(): void
    {
        $this->assertNotNull(ProductionDatabaseGuard::violation(
            $this->test(['host' => 'aws-0-us-east-1.pooler.supabase.com', 'username' => 'postgres.prodref']),
            $this->production(),
        ));
    }

    public function test_identical_connection_settings_are_refused(): void
    {
        // This is what happens when .env.testing is missing and Laravel falls back to .env.
        $this->assertNotNull(ProductionDatabaseGuard::violation(
            $this->test(['username' => 'postgres.prodref']),
            $this->production(),
        ));
    }

    public function test_the_ref_comparison_is_case_and_whitespace_insensitive(): void
    {
        $this->assertNotNull(ProductionDatabaseGuard::violation(
            $this->test(['host' => '  '.strtoupper(self::POOLER), 'username' => 'Postgres.ProdRef ']),
            $this->production(),
        ));
    }

    public function test_direct_supabase_hosts_are_told_apart_by_the_ref_in_the_host(): void
    {
        $prod = $this->production(['host' => 'db.prodref.supabase.co', 'username' => 'postgres']);

        $this->assertNull(ProductionDatabaseGuard::violation(
            $this->test(['host' => 'db.testref.supabase.co', 'username' => 'postgres']),
            $prod,
        ));
        $this->assertNotNull(ProductionDatabaseGuard::violation(
            $this->test(['host' => 'db.prodref.supabase.co', 'username' => 'postgres']),
            $prod,
        ));
    }

    public function test_when_the_project_cannot_be_identified_the_same_host_and_database_is_refused(): void
    {
        $prod = $this->production(['host' => 'db.example.org', 'username' => 'app']);

        $this->assertNotNull(ProductionDatabaseGuard::violation(
            $this->test(['host' => 'db.example.org', 'username' => 'tester', 'database' => 'postgres']),
            $prod + ['database' => 'postgres'],
        ));
        // Same server but a different database is a different database.
        $this->assertNull(ProductionDatabaseGuard::violation(
            $this->test(['host' => 'db.example.org', 'username' => 'tester', 'database' => 'keymarket_test']),
            $prod + ['database' => 'postgres'],
        ));
    }

    public function test_without_a_production_env_to_compare_only_a_local_database_is_allowed(): void
    {
        $this->assertNull(ProductionDatabaseGuard::violation($this->test(['host' => 'localhost']), null));
        $this->assertNull(ProductionDatabaseGuard::violation($this->test(['host' => '127.0.0.1']), null));
        $this->assertNotNull(ProductionDatabaseGuard::violation($this->test(), null));
    }

    #[DataProvider('invalidTestConfigurations')]
    public function test_unusable_configurations_are_refused(array $overrides): void
    {
        $this->assertNotNull(ProductionDatabaseGuard::violation($this->test($overrides), $this->production()));
    }

    public static function invalidTestConfigurations(): array
    {
        return [
            'sqlite is not supported' => [['driver' => 'sqlite']],
            'no driver' => [['driver' => null]],
            'DB_URL set' => [['url' => 'postgres://user:pass@somewhere/db']],
            'empty host' => [['host' => '']],
            'missing host' => [['host' => null]],
        ];
    }

    public function test_project_ref_parsing(): void
    {
        $this->assertSame('abc123', ProductionDatabaseGuard::projectRef('anything', 'postgres.abc123'));
        $this->assertSame('abc123', ProductionDatabaseGuard::projectRef('db.abc123.supabase.co', 'postgres'));
        $this->assertNull(ProductionDatabaseGuard::projectRef('localhost', 'postgres'));
    }
}
