<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\ProductionDatabaseGuard;

abstract class TestCase extends BaseTestCase
{
    /**
     * Runs before any test trait (RefreshDatabase wipes the database), so a mis-pointed
     * .env.testing makes the whole run fail here instead of destroying production data.
     * Every test that boots the app must extend this class.
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        ProductionDatabaseGuard::assertSafe($app);

        return $app;
    }
}
