<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/** Thrown by the simulated payment when the card is declined. Rendered as 402. */
class PaymentDeclinedException extends Exception
{
    public function render(): JsonResponse
    {
        return response()->json(['message' => 'Payment declined.'], 402);
    }
}
