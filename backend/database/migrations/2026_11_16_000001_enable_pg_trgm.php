<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// pg_trgm gives us similarity() / word_similarity(), which power the typo-tolerant search.
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    }

    public function down(): void
    {
        // Left installed on purpose: other databases objects may rely on it.
    }
};
