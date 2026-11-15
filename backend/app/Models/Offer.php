<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offer extends Model
{
    protected $guarded = [];

    private const STOCK_SQL = '(SELECT COUNT(*) FROM game_keys k WHERE k.offer_id = offers.id AND k.order_item_id IS NULL)';

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function keys(): HasMany
    {
        return $this->hasMany(GameKey::class);
    }

    /** Adds a `stock` column: the number of unsold keys. */
    public function scopeWithStock(Builder $query): Builder
    {
        return $query->select('offers.*')->selectRaw(self::STOCK_SQL.' AS stock');
    }

    public function scopeInStock(Builder $query): Builder
    {
        return $query->whereRaw(self::STOCK_SQL.' > 0');
    }
}
