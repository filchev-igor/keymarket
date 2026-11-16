<?php

namespace Tests\Feature;

use App\Models\GameKey;
use App\Models\Offer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\BuildsMarketplace;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use BuildsMarketplace;
    use RefreshDatabase;

    private const APPROVED_CARD = '4242424242424242';

    /** Buys as the given user. */
    private function checkout(User $user, array $items, string $card = self::APPROVED_CARD): TestResponse
    {
        Sanctum::actingAs($user);

        return $this->postJson('/api/checkout', ['items' => $items, 'payment' => ['card_number' => $card]]);
    }

    private function line(Offer $offer, int $quantity = 1): array
    {
        return ['offer_id' => $offer->id, 'quantity' => $quantity];
    }

    // ---------- Who may check out ----------

    public function test_guests_cannot_check_out(): void
    {
        $offer = $this->makeOffer($this->makeProduct(), 1999, keys: 3);

        $this->postJson('/api/checkout', ['items' => [$this->line($offer)], 'payment' => ['card_number' => self::APPROVED_CARD]])
            ->assertUnauthorized();

        $this->assertSame(0, Order::count());
        $this->assertSame(3, $this->unsoldKeys($offer), 'no key may be sold to a guest');
    }

    // ---------- Issuing keys ----------

    public function test_checkout_issues_one_unique_key_per_unit_and_updates_stock(): void
    {
        $user = User::factory()->create();
        $offer = $this->makeOffer($this->makeProduct(['name' => 'Key Game']), 1999, keys: 5);

        $response = $this->checkout($user, [$this->line($offer, 2)])->assertCreated()
            ->assertJsonPath('data.total', 3998)
            ->assertJsonPath('data.currency', 'EUR')
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.product.name', 'Key Game')
            ->assertJsonPath('data.items.0.unit_price', 1999);

        $keys = $response->json('data.items.*.key');
        $this->assertCount(2, array_unique($keys), 'each unit gets a different key');

        foreach ($keys as $code) {
            $key = GameKey::where('code', $code)->firstOrFail();
            $this->assertSame($offer->id, $key->offer_id);
            $this->assertNotNull($key->order_item_id, 'the issued key is attached to the order');
        }
        $this->assertSame(3, $this->unsoldKeys($offer));
        $this->assertSame(1, Order::where('user_id', $user->id)->count());
        $this->assertSame(2, OrderItem::count());
    }

    public function test_repeated_lines_for_the_same_offer_are_merged(): void
    {
        $offer = $this->makeOffer($this->makeProduct(), 1000, keys: 5);

        $this->checkout(User::factory()->create(), [$this->line($offer), $this->line($offer)])
            ->assertCreated()->assertJsonCount(2, 'data.items')->assertJsonPath('data.total', 2000);
    }

    public function test_one_order_can_contain_several_offers(): void
    {
        $a = $this->makeOffer($this->makeProduct(), 1500, keys: 3);
        $b = $this->makeOffer($this->makeProduct(), 2500, keys: 3);

        $this->checkout(User::factory()->create(), [$this->line($a), $this->line($b, 2)])
            ->assertCreated()->assertJsonCount(3, 'data.items')->assertJsonPath('data.total', 6500);

        $this->assertSame(2, $this->unsoldKeys($a));
        $this->assertSame(1, $this->unsoldKeys($b));
    }

    public function test_a_key_is_never_sold_twice(): void
    {
        $offer = $this->makeOffer($this->makeProduct(), 1000, keys: 3);
        [$first, $second, $third] = User::factory()->count(3)->create()->all();

        $keysOfFirst = $this->checkout($first, [$this->line($offer, 2)])->assertCreated()->json('data.items.*.key');

        // Only one key is left: a second buyer asking for two must fail and get nothing.
        $this->checkout($second, [$this->line($offer, 2)])->assertStatus(409);
        $this->assertSame(0, Order::where('user_id', $second->id)->count());
        $this->assertSame(1, $this->unsoldKeys($offer));

        // ...but can buy the one that is left, and it is not one of the keys already sold.
        $keysOfSecond = $this->checkout($second, [$this->line($offer)])->assertCreated()->json('data.items.*.key');
        $this->assertSame([], array_intersect($keysOfFirst, $keysOfSecond));
        $this->assertSame(0, $this->unsoldKeys($offer));

        // Sold out.
        $this->checkout($third, [$this->line($offer)])->assertStatus(409);

        $allIssued = array_merge($keysOfFirst, $keysOfSecond);
        $this->assertCount(3, array_unique($allIssued));
        $this->assertSame(3, GameKey::whereNotNull('order_item_id')->count());
    }

    public function test_the_database_itself_refuses_to_attach_two_keys_to_one_order_item(): void
    {
        $offer = $this->makeOffer($this->makeProduct(), 1000, keys: 2);
        $this->checkout(User::factory()->create(), [$this->line($offer)])->assertCreated();
        $itemId = OrderItem::firstOrFail()->id;

        $this->expectException(QueryException::class);
        GameKey::create(['offer_id' => $offer->id, 'code' => 'DUPLICATE-ATTACH', 'order_item_id' => $itemId]);
    }

    // ---------- Payment (simulated) ----------

    #[DataProvider('declinedCards')]
    public function test_a_declined_card_charges_nothing_and_issues_no_key(string $card): void
    {
        $user = User::factory()->create();
        $offer = $this->makeOffer($this->makeProduct(), 1999, keys: 5);

        $this->checkout($user, [$this->line($offer, 2)], $card)
            ->assertStatus(402)
            ->assertExactJson(['message' => 'Payment declined.']);

        $this->assertSame(0, Order::count(), 'no order is created');
        $this->assertSame(0, OrderItem::count());
        $this->assertSame(5, $this->unsoldKeys($offer), 'every key is still for sale');
        $this->assertSame(0, GameKey::whereNotNull('order_item_id')->count());

        Sanctum::actingAs($user);
        $this->getJson('/api/orders')->assertOk()->assertJsonCount(0, 'data');
    }

    public static function declinedCards(): array
    {
        return [
            'plain digits' => ['4000000000000002'],
            'with spaces' => ['4000 0000 0000 0002'],
            'with dashes' => ['4000-0000-0000-0002'],
            'with non-breaking spaces' => ["4000\u{00A0}0000\u{00A0}0000\u{00A0}0002"],
            'another number ending in 0002' => ['5555555550000002'],
        ];
    }

    public function test_after_a_declined_card_the_same_buyer_can_still_pay_and_gets_a_key(): void
    {
        $user = User::factory()->create();
        $offer = $this->makeOffer($this->makeProduct(), 1999, keys: 1);

        $this->checkout($user, [$this->line($offer)], '4000 0000 0000 0002')->assertStatus(402);
        $this->checkout($user, [$this->line($offer)], '4242 4242 4242 4242')->assertCreated()->assertJsonCount(1, 'data.items');

        $this->assertSame(0, $this->unsoldKeys($offer));
        $this->assertSame(1, Order::count());
    }

    public function test_an_approved_card_may_be_typed_with_spaces(): void
    {
        $offer = $this->makeOffer($this->makeProduct(), 1999, keys: 1);

        $this->checkout(User::factory()->create(), [$this->line($offer)], '4242 4242 4242 4242')->assertCreated();
    }

    // ---------- Stock problems roll everything back ----------

    public function test_buying_more_than_the_stock_fails_and_changes_nothing(): void
    {
        $offer = $this->makeOffer($this->makeProduct(['name' => 'Rare Game']), 1999, keys: 2);

        $this->checkout(User::factory()->create(), [$this->line($offer, 3)])
            ->assertStatus(409)->assertJsonPath('message', 'Not enough stock for Rare Game.');

        $this->assertSame(2, $this->unsoldKeys($offer));
        $this->assertSame(0, Order::count());
    }

    public function test_a_failure_on_one_line_rolls_back_the_keys_of_the_other_lines(): void
    {
        $plenty = $this->makeOffer($this->makeProduct(), 1000, keys: 5); // created first, so it is processed first
        $scarce = $this->makeOffer($this->makeProduct(), 1000, keys: 1);

        $this->checkout(User::factory()->create(), [$this->line($plenty, 2), $this->line($scarce, 2)])->assertStatus(409);

        $this->assertSame(5, $this->unsoldKeys($plenty), 'keys already picked for the first line were released');
        $this->assertSame(1, $this->unsoldKeys($scarce));
        $this->assertSame(0, Order::count());
        $this->assertSame(0, OrderItem::count());
    }

    public function test_an_unknown_offer_cannot_be_bought(): void
    {
        $this->checkout(User::factory()->create(), [['offer_id' => 999999, 'quantity' => 1]])->assertStatus(409);

        $this->assertSame(0, Order::count());
    }

    // ---------- Validation ----------

    #[DataProvider('invalidCheckoutPayloads')]
    public function test_invalid_checkout_requests_are_rejected(array $payload, string $field): void
    {
        $offer = $this->makeOffer($this->makeProduct(), 1000, keys: 2);
        $payload = json_decode(str_replace('__OFFER__', (string) $offer->id, json_encode($payload)), true);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/checkout', $payload)->assertUnprocessable()->assertJsonValidationErrors($field);

        $this->assertSame(0, Order::count());
        $this->assertSame(2, $this->unsoldKeys($offer));
    }

    public static function invalidCheckoutPayloads(): array
    {
        $card = ['card_number' => '4242424242424242'];
        $line = [['offer_id' => '__OFFER__', 'quantity' => 1]];

        return [
            'no items' => [['items' => [], 'payment' => $card], 'items'],
            'zero quantity' => [['items' => [['offer_id' => '__OFFER__', 'quantity' => 0]], 'payment' => $card], 'items.0.quantity'],
            'quantity above 10' => [['items' => [['offer_id' => '__OFFER__', 'quantity' => 11]], 'payment' => $card], 'items.0.quantity'],
            'no payment' => [['items' => $line], 'payment.card_number'],
            'letters instead of a card' => [['items' => $line, 'payment' => ['card_number' => 'abcd efgh ijkl']], 'payment.card_number'],
            'card too short' => [['items' => $line, 'payment' => ['card_number' => '4242 4242']], 'payment.card_number'],
        ];
    }

    // ---------- Orders belong to their buyer ----------

    public function test_a_buyer_sees_their_orders_with_the_keys_and_nobody_else_does(): void
    {
        [$buyer, $other] = User::factory()->count(2)->create()->all();
        $offer = $this->makeOffer($this->makeProduct(['name' => 'Owned Game']), 1999, keys: 3);

        $orderId = $this->checkout($buyer, [$this->line($offer, 2)])->assertCreated()->json('data.id');
        $keys = $this->getJson("/api/orders/$orderId")->assertOk()->json('data.items.*.key');
        $this->assertCount(2, $keys);

        $this->getJson('/api/orders')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $orderId)
            ->assertJsonPath('data.0.items_count', 2)
            ->assertJsonPath('data.0.total', 3998);

        Sanctum::actingAs($other);
        $this->getJson("/api/orders/$orderId")->assertNotFound();
        $this->getJson('/api/orders')->assertOk()->assertJsonCount(0, 'data');
    }

    // ---------- Cart pricing (public) ----------

    public function test_the_cart_preview_prices_lines_and_flags_unavailable_ones(): void
    {
        $offer = $this->makeOffer($this->makeProduct(['name' => 'Cart Game']), 1500, keys: 2);

        $this->postJson('/api/cart/preview', ['items' => [$this->line($offer, 2)]])->assertOk()
            ->assertJsonPath('total', 3000)
            ->assertJsonPath('items.0.available', true)
            ->assertJsonPath('items.0.unit_price', 1500)
            ->assertJsonPath('items.0.line_total', 3000)
            ->assertJsonPath('items.0.product.name', 'Cart Game');

        // More than the stock: reported, and not counted in the total.
        $this->postJson('/api/cart/preview', ['items' => [$this->line($offer, 3)]])->assertOk()
            ->assertJsonPath('items.0.available', false)
            ->assertJsonPath('total', 0);

        // An offer that no longer exists.
        $this->postJson('/api/cart/preview', ['items' => [['offer_id' => 999999, 'quantity' => 1]]])->assertOk()
            ->assertJsonPath('items.0.available', false)
            ->assertJsonPath('items.0.product', null)
            ->assertJsonPath('total', 0);

        $this->postJson('/api/cart/preview', ['items' => []])->assertUnprocessable();
    }
}
