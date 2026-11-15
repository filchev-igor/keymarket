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
            'price' => $this->price === null ? null : (int) $this->price,
            'old_price' => $this->old_price === null ? null : (int) $this->old_price,
            'discount_percent' => $this->discount_percent === null ? null : (int) $this->discount_percent,
            'offers_count' => (int) ($this->offers_count ?? 0),
        ];
    }
}
