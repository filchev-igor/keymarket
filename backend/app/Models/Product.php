<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['release_date' => 'date'];
    }

    /** SQL expression for the discount (percent) of the cheapest offer. Needs scopeWithBestOffer. */
    public const DISCOUNT_SQL = 'ROUND((best.old_price - best.price) * 100.0 / NULLIF(best.old_price, 0))';

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    /**
     * Adds the cheapest in-stock offer to every product row:
     * columns price, old_price, offers_count and discount_percent (all NULL when nothing is in stock).
     * The cheapest offer per product is picked with Postgres DISTINCT ON.
     */
    public function scopeWithBestOffer(Builder $query): Builder
    {
        $best = <<<'SQL'
            SELECT DISTINCT ON (s.product_id) s.product_id, s.offer_id, s.price, s.old_price,
                   COUNT(*) OVER (PARTITION BY s.product_id) AS offers_count
            FROM (
                SELECT o.product_id, o.id AS offer_id, o.price, o.old_price
                FROM offers o
                WHERE EXISTS (
                    SELECT 1 FROM game_keys k WHERE k.offer_id = o.id AND k.order_item_id IS NULL
                )
            ) s
            ORDER BY s.product_id, s.price, s.offer_id
        SQL;

        return $query
            ->leftJoinSub($best, 'best', 'best.product_id', '=', 'products.id')
            ->select('products.*', 'best.price', 'best.old_price', 'best.offers_count', 'best.offer_id AS best_offer_id')
            ->selectRaw(self::DISCOUNT_SQL.' AS discount_percent');
    }
}
