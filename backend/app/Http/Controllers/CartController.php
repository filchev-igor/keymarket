<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /** The cart lives in the browser; this prices it and reports which lines are still buyable. */
    public function preview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.offer_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $offers = Offer::withStock()
            ->with('product', 'seller')
            ->whereIn('id', collect($data['items'])->pluck('offer_id'))
            ->get()
            ->keyBy('id');

        $total = 0;
        $lines = collect($data['items'])->map(function ($item) use ($offers, &$total) {
            $offer = $offers->get($item['offer_id']);
            if (! $offer) {
                return [
                    'offer_id' => $item['offer_id'], 'quantity' => $item['quantity'],
                    'unit_price' => null, 'line_total' => 0, 'available' => false,
                    'product' => null, 'seller' => null,
                ];
            }

            $available = (int) $offer->stock >= $item['quantity'];
            $lineTotal = $offer->price * $item['quantity'];
            if ($available) {
                $total += $lineTotal;
            }

            return [
                'offer_id' => $offer->id,
                'quantity' => $item['quantity'],
                'unit_price' => $offer->price,
                'line_total' => $lineTotal,
                'available' => $available,
                'product' => [
                    'id' => $offer->product->id,
                    'slug' => $offer->product->slug,
                    'name' => $offer->product->name,
                    'platform' => $offer->product->platform,
                    'region' => $offer->product->region,
                    'cover_color' => $offer->product->cover_color,
                ],
                'seller' => ['id' => $offer->seller->id, 'name' => $offer->seller->name],
            ];
        })->values();

        return response()->json(['items' => $lines, 'total' => $total, 'currency' => 'EUR']);
    }
}
