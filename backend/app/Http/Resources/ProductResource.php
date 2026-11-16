<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Product list item (see API.md "Product"). Expects the row to come from Product::withBestOffer(). */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'platform' => $this->platform,
            'region' => $this->region,
            'genre' => $this->genre,
            'cover_color' => $this->cover_color,
            // The cheapest in-stock offer (what "Add to cart" on a product card buys); null when nothing is in stock.
            'best_offer_id' => $this->best_offer_id === null ? null : (int) $this->best_offer_id,
            'price' => $this->price === null ? null : (int) $this->price,
            'old_price' => $this->old_price === null ? null : (int) $this->old_price,
            'discount_percent' => $this->discount_percent === null ? null : (int) $this->discount_percent,
            'offers_count' => (int) ($this->offers_count ?? 0),
        ];
    }
}
