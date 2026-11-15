<?php

namespace App\Services;

use App\Exceptions\StockException;
use App\Models\GameKey;
use App\Models\Offer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(private PaymentSimulator $payments) {}

    /**
     * Buys the cart in ONE transaction: any failure (stock, payment) rolls everything back,
     * so keys are never half-assigned.
     *
     * @param  array<int, array{offer_id: int, quantity: int}>  $items
     */
    public function purchase(User $user, array $items, string $cardNumber): Order
    {
        // Merge duplicate lines and sort by offer id so concurrent checkouts lock in the same order.
        $wanted = collect($items)
            ->groupBy('offer_id')
            ->map(fn ($lines) => (int) $lines->sum('quantity'))
            ->sortKeys();

        return DB::transaction(function () use ($user, $wanted, $cardNumber) {
            $order = Order::create(['user_id' => $user->id, 'total' => 0, 'currency' => 'EUR']);
            $total = 0;

            foreach ($wanted as $offerId => $quantity) {
                $offer = Offer::with('product')->find($offerId);
                if (! $offer) {
                    throw new StockException('An offer in your cart is no longer available.');
                }

                // FOR UPDATE SKIP LOCKED: rows another buyer is taking right now are skipped,
                // so two buyers can never receive the same key.
                $keys = GameKey::where('offer_id', $offerId)
                    ->whereNull('order_item_id')
                    ->orderBy('id')
                    ->limit($quantity)
                    ->lock('for update skip locked')
                    ->get();

                if ($keys->count() < $quantity) {
                    throw new StockException("Not enough stock for {$offer->product->name}.");
                }

                foreach ($keys as $key) {
                    $item = OrderItem::create([
                        'order_id' => $order->id,
                        'offer_id' => $offer->id,
                        'product_id' => $offer->product_id,
                        'seller_id' => $offer->seller_id,
                        'unit_price' => $offer->price,
                    ]);
                    $key->update(['order_item_id' => $item->id]);
                    $total += $offer->price;
                }
            }

            $order->update(['total' => $total]);
            $this->payments->charge($cardNumber, $total); // throws -> whole transaction rolls back

            return $order->load('items.product', 'items.seller', 'items.gameKey');
        });
    }
}
