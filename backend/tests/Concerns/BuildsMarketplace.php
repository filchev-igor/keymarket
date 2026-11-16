<?php

namespace Tests\Concerns;

use App\Models\GameKey;
use App\Models\Offer;
use App\Models\Product;
use App\Models\Seller;
use Illuminate\Support\Str;

/** Tiny builders so each test creates exactly the catalog it needs (the full seeder is too slow for a remote DB). */
trait BuildsMarketplace
{
    private int $keyCounter = 0;

    protected function makeProduct(array $attributes = []): Product
    {
        $name = $attributes['name'] ?? 'Test Game '.Str::random(5);

        return Product::create($attributes + [
            'slug' => Str::slug($name.' '.($attributes['platform'] ?? 'Steam').' '.($attributes['region'] ?? 'Global').' '.Str::random(4)),
            'name' => $name,
            'platform' => 'Steam',
            'region' => 'Global',
            'genre' => 'Action',
            'cover_color' => '#4618AC',
            'description' => 'A test game.',
            'release_date' => '2024-01-01',
            'units_sold' => 0,
        ]);
    }

    /** An offer with `$keys` unsold keys, so its stock equals `$keys`. */
    protected function makeOffer(Product $product, int $price, int $keys = 5, ?int $oldPrice = null, ?Seller $seller = null): Offer
    {
        $offer = Offer::create([
            'product_id' => $product->id,
            'seller_id' => ($seller ?? Seller::create(['name' => 'Seller '.Str::random(5), 'rating' => 4.5]))->id,
            'price' => $price,
            'old_price' => $oldPrice,
        ]);

        for ($i = 0; $i < $keys; $i++) {
            GameKey::create(['offer_id' => $offer->id, 'code' => sprintf('TEST-%05d-%s', ++$this->keyCounter, Str::upper(Str::random(5)))]);
        }

        return $offer;
    }

    protected function unsoldKeys(Offer $offer): int
    {
        return GameKey::where('offer_id', $offer->id)->whereNull('order_item_id')->count();
    }
}
