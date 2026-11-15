<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** Single product page: the list fields plus description, release date and all in-stock offers. */
class ProductDetailResource extends ProductResource
{
    public function toArray(Request $request): array
    {
        return parent::toArray($request) + [
            'description' => $this->description,
            'release_date' => $this->release_date?->toDateString(),
            'offers' => OfferResource::collection($this->offers),
        ];
    }
}
