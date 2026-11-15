<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Safe to run on every deploy: the demo user is upserted and the catalog is only
 * created when the products table is empty.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo account, also documented in the README.
        User::firstOrCreate(
            ['email' => 'demo@keymarket.test'],
            ['name' => 'Demo User', 'password' => 'demo1234'],
        );

        $this->call(MarketplaceSeeder::class);
    }
}
