<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Expects the offer to be loaded with the `seller` relation and scopeWithStock(). */
class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'price' => $this->price,
            'old_price' => $this->old_price,
            'stock' => (int) $this->stock,
            'seller' => [
                'id' => $this->seller->id,
                'name' => $this->seller->name,
                'rating' => $this->seller->rating,
            ],
        ];
    }
}
