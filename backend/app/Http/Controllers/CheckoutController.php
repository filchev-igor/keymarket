<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function store(Request $request, CheckoutService $checkout): JsonResponse
    {
        // Accept the usual ways of writing a card number: spaces, dashes and non-breaking spaces
        // (what you get when pasting from a web page) are separators, not part of the number.
        $request->merge([
            'payment' => ['card_number' => preg_replace('/[\s\x{00A0}-]+/u', '', (string) $request->input('payment.card_number'))],
        ]);

        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.offer_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'payment.card_number' => ['required', 'regex:/^\d{12,19}$/'],
        ]);

        $order = $checkout->purchase($request->user(), $data['items'], $data['payment']['card_number']);

        return response()->json(['data' => new OrderResource($order)], 201);
    }
}
