<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('rating', 2, 1)->default(4.5);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('platform')->index();
            $table->string('region')->index();
            $table->string('genre')->index();
            $table->string('cover_color', 7);
            $table->text('description');
            $table->date('release_date')->nullable();
            $table->unsignedInteger('units_sold')->default(0); // drives "best sellers"
            $table->timestamps();
        });

        // Trigram index so similarity()/ILIKE searches on the name stay fast.
        DB::statement('CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops)');

        // One offer = one seller selling one product at a price.
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('price');             // cents
            $table->unsignedInteger('old_price')->nullable(); // cents, set when discounted
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total')->default(0); // cents
            $table->string('currency', 3)->default('EUR');
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->constrained();
            $table->foreignId('product_id')->constrained();
            $table->foreignId('seller_id')->constrained();
            $table->unsignedInteger('unit_price'); // price at purchase time, cents
            $table->timestamps();
        });

        // The digital keys. Stock of an offer = its keys not yet attached to an order item.
        Schema::create('game_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->string('code')->unique(); // unique at DB level: a key can exist only once
            $table->foreignId('order_item_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->index(['offer_id', 'order_item_id']);
        });

        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('color', 7);
            $table->string('link');
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banners');
        Schema::dropIfExists('game_keys');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('products');
        Schema::dropIfExists('sellers');
    }
};
