<?php

use Illuminate\Support\Facades\Route;

// This app is an API only (the React frontend is a separate site). The root URL just says what lives here.
Route::get('/', fn () => response()->json([
    'name' => 'keymarket API',
    'health' => '/api/health',
]));
