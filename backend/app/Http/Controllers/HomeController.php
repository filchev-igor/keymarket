<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Banner;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

/** One method per homepage block; the frontend calls each endpoint separately. */
class HomeController extends Controller
{
    public function banners(): JsonResponse
    {
        $banners = Banner::orderBy('position')->get(['id', 'title', 'subtitle', 'color', 'link']);

        return response()->json(['data' => $banners]);
    }

    public function bestSellers(): JsonResponse
    {
        $products = Product::withBestOffer()
            ->whereNotNull('best.price')
            ->orderByDesc('units_sold')
            ->limit(10)
            ->get();

        return response()->json(['data' => ProductResource::collection($products)]);
    }

    public function deals(): JsonResponse
    {
        $products = Product::withBestOffer()
            ->whereNotNull('best.old_price')
            ->orderByRaw(Product::DISCOUNT_SQL.' DESC')
            ->limit(10)
            ->get();

        return response()->json(['data' => ProductResource::collection($products)]);
    }
}
