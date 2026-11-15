<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

// Contract: see /API.md at the repo root.

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:20,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::prefix('home')->group(function () {
    Route::get('/banners', [HomeController::class, 'banners']);
    Route::get('/best-sellers', [HomeController::class, 'bestSellers']);
    Route::get('/deals', [HomeController::class, 'deals']);
});

Route::get('/filters', [CatalogController::class, 'filters']);
Route::get('/products', [CatalogController::class, 'index']);
Route::get('/products/{slug}', [CatalogController::class, 'show']);

Route::post('/cart/preview', [CartController::class, 'preview']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
});
