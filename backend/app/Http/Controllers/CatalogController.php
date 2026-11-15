<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\Offer;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /** Values for the store filter UI. */
    public function filters(): JsonResponse
    {
        $price = Offer::inStock()->selectRaw('MIN(price) AS min, MAX(price) AS max')->first();

        return response()->json([
            'platforms' => Product::distinct()->orderBy('platform')->pluck('platform'),
            'regions' => Product::distinct()->orderBy('region')->pluck('region'),
            'genres' => Product::distinct()->orderBy('genre')->pluck('genre'),
            'price' => ['min' => (int) $price->min, 'max' => (int) $price->max],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $params = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'platform' => ['nullable', 'string'],
            'region' => ['nullable', 'string'],
            'genre' => ['nullable', 'string'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0'],
            'sort' => ['nullable', 'in:relevance,popularity,price_asc,price_desc,discount,name'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        $term = trim($params['q'] ?? '');
        $query = Product::withBestOffer();

        foreach (['platform', 'region', 'genre'] as $field) {
            if (! empty($params[$field])) {
                $query->where("products.$field", $params[$field]);
            }
        }
        // Price filters apply to the cheapest in-stock offer, so out-of-stock products drop out.
        if (isset($params['min_price'])) {
            $query->where('best.price', '>=', $params['min_price']);
        }
        if (isset($params['max_price'])) {
            $query->where('best.price', '<=', $params['max_price']);
        }

        $like = '%'.addcslashes($term, '%_\\').'%';
        if ($term !== '') {
            // Typo tolerance (pg_trgm): whole-name similarity, or the term resembling any word group in the name.
            $query->where(function ($w) use ($like, $term) {
                $w->where('products.name', 'ilike', $like)
                    ->orWhereRaw('similarity(products.name, ?) > 0.25', [$term])
                    ->orWhereRaw('word_similarity(?, products.name) > 0.4', [$term]);
            });
        }

        $sort = $params['sort'] ?? ($term !== '' ? 'relevance' : 'popularity');
        match ($sort) {
            'relevance' => $term !== ''
                ? $query->orderByRaw('(products.name ILIKE ?) DESC', [$like])
                    ->orderByRaw('GREATEST(similarity(products.name, ?), word_similarity(?, products.name)) DESC', [$term, $term])
                    ->orderByDesc('units_sold')
                : $query->orderByDesc('units_sold'),
            'popularity' => $query->orderByDesc('units_sold'),
            'price_asc' => $query->orderByRaw('best.price ASC NULLS LAST'),
            'price_desc' => $query->orderByRaw('best.price DESC NULLS LAST'),
            'discount' => $query->orderByRaw(Product::DISCOUNT_SQL.' DESC NULLS LAST'),
            'name' => $query->orderBy('products.name'),
        };
        $query->orderBy('products.id'); // stable order for pagination

        $page = $query->paginate($params['per_page'] ?? 24);

        return response()->json([
            'data' => ProductResource::collection($page->items()),
            'meta' => [
                'page' => $page->currentPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'last_page' => $page->lastPage(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::withBestOffer()->where('slug', $slug)->firstOrFail();

        $product->setRelation('offers', Offer::withStock()
            ->inStock()
            ->where('product_id', $product->id)
            ->with('seller')
            ->orderBy('price')
            ->get());

        return response()->json(['data' => new ProductDetailResource($product)]);
    }
}
