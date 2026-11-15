<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Full order with the purchased keys. Expects items.product, items.seller and items.gameKey loaded. */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total' => $this->total,
            'currency' => $this->currency,
            'created_at' => $this->created_at->toIso8601String(),
            'items' => $this->items->map(fn ($item) => [
                'product' => [
                    'id' => $item->product->id,
                    'slug' => $item->product->slug,
                    'name' => $item->product->name,
                    'platform' => $item->product->platform,
                    'region' => $item->product->region,
                    'cover_color' => $item->product->cover_color,
                ],
                'seller' => ['id' => $item->seller->id, 'name' => $item->seller->name],
                'unit_price' => $item->unit_price,
                'key' => $item->gameKey->code,
            ])->values(),
        ];
    }
}
