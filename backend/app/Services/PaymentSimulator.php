<?php

namespace App\Services;

use App\Exceptions\PaymentDeclinedException;

/**
 * Fake payment provider. No money moves and nothing is stored:
 * every card is accepted except numbers ending in 0002, so the failure path can be demoed.
 */
class PaymentSimulator
{
    public function charge(string $cardNumber, int $amountCents): void
    {
        if (str_ends_with($cardNumber, '0002')) {
            throw new PaymentDeclinedException;
        }
    }
}
