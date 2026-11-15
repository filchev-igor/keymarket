<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()->withCount('items')->latest('id')->get();

        return response()->json(['data' => $orders->map(fn ($order) => [
            'id' => $order->id,
            'total' => $order->total,
            'currency' => $order->currency,
            'created_at' => $order->created_at->toIso8601String(),
            'items_count' => $order->items_count,
        ])]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        // Scoped to the signed-in user: someone else's order is a 404, not a leak.
        $order = $request->user()->orders()
            ->with('items.product', 'items.seller', 'items.gameKey')
            ->findOrFail($id);

        return response()->json(['data' => new OrderResource($order)]);
    }
}
