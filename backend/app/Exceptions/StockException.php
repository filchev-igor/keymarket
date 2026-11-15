<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/** Thrown when an offer cannot supply the requested number of keys. Rendered as 409. */
class StockException extends Exception
{
    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
