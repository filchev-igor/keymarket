<?php

namespace Tests\Feature;

use App\Models\Banner;
use App\Models\Offer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsMarketplace;
use Tests\TestCase;

/**
 * Store filters, sorting, search (including typos and partial names), product page and the homepage blocks.
 * Search relies on Postgres pg_trgm, which is why these tests run on Postgres and not SQLite.
 */
class CatalogTest extends TestCase
{
    use BuildsMarketplace;
    use RefreshDatabase;

    private Product $cyber;   // Steam / Europe / Racing, two in-stock offers, discounted

    private Product $dragon;  // PlayStation / Global / RPG

    private Product $farm;    // Xbox / North America / Simulation, discounted

    private Product $soldOut; // Steam / Global / Strategy, no keys left

    private Offer $cyberBestOffer; // the 3999 offer: the cheapest one that is in stock

    protected function setUp(): void
    {
        parent::setUp();

        $this->cyber = $this->makeProduct(['name' => 'Cyber Drift 2077', 'platform' => 'Steam', 'region' => 'Europe', 'genre' => 'Racing', 'units_sold' => 300]);
        $this->cyberBestOffer = $this->makeOffer($this->cyber, 3999, keys: 3, oldPrice: 5999);
        $this->makeOffer($this->cyber, 4500, keys: 2);
        $this->makeOffer($this->cyber, 3000, keys: 0); // cheapest, but no stock: must be ignored everywhere

        $this->dragon = $this->makeProduct(['name' => 'Dragon Keep Legends', 'platform' => 'PlayStation', 'region' => 'Global', 'genre' => 'RPG', 'units_sold' => 500]);
        $this->makeOffer($this->dragon, 5999, keys: 5);

        $this->farm = $this->makeProduct(['name' => 'Farm Valley Dreams', 'platform' => 'Xbox', 'region' => 'North America', 'genre' => 'Simulation', 'units_sold' => 100]);
        $this->makeOffer($this->farm, 1999, keys: 5, oldPrice: 2499);

        $this->soldOut = $this->makeProduct(['name' => 'Sold Out Saga', 'platform' => 'Steam', 'region' => 'Global', 'genre' => 'Strategy', 'units_sold' => 0]);
        $this->makeOffer($this->soldOut, 999, keys: 0);
    }

    private function names(array $query = []): array
    {
        return $this->getJson('/api/products?'.http_build_query($query))->assertOk()->json('data.*.name');
    }

    // ---------- Store: browse, filters, sorting ----------

    public function test_the_store_lists_every_product_with_its_cheapest_in_stock_offer(): void
    {
        $response = $this->getJson('/api/products')->assertOk()->assertJsonPath('meta.total', 4);

        $byName = collect($response->json('data'))->keyBy('name');
        $this->assertSame(3999, $byName['Cyber Drift 2077']['price'], 'the cheaper offer without stock must be ignored');
        $this->assertSame(5999, $byName['Cyber Drift 2077']['old_price']);
        $this->assertSame(33, $byName['Cyber Drift 2077']['discount_percent']);
        $this->assertSame(2, $byName['Cyber Drift 2077']['offers_count']);
        $this->assertSame(20, $byName['Farm Valley Dreams']['discount_percent']);
        $this->assertNull($byName['Dragon Keep Legends']['discount_percent']);
        $this->assertNull($byName['Sold Out Saga']['price'], 'a product with no stock is listed but has no price');
        $this->assertSame(0, $byName['Sold Out Saga']['offers_count']);
    }

    public function test_each_product_exposes_the_id_of_its_cheapest_in_stock_offer(): void
    {
        $byName = collect($this->getJson('/api/products')->assertOk()->json('data'))->keyBy('name');

        // The 3000 offer is cheaper but has no keys, so the best offer is the 3999 one.
        $this->assertSame($this->cyberBestOffer->id, $byName['Cyber Drift 2077']['best_offer_id']);
        $this->assertNull($byName['Sold Out Saga']['best_offer_id'], 'nothing in stock, nothing to add to the cart');

        // "Add to cart" on a card must buy exactly that offer: it is priced and available in the cart.
        $this->postJson('/api/cart/preview', ['items' => [['offer_id' => $byName['Cyber Drift 2077']['best_offer_id'], 'quantity' => 1]]])
            ->assertOk()->assertJsonPath('items.0.available', true)->assertJsonPath('items.0.unit_price', 3999);

        // The product page and the homepage blocks carry the same field.
        $this->getJson('/api/products/'.$this->cyber->slug)->assertJsonPath('data.best_offer_id', $this->cyberBestOffer->id);
        $this->getJson('/api/home/deals')->assertJsonPath('data.0.best_offer_id', $this->cyberBestOffer->id);
    }

    public function test_it_filters_by_platform_region_and_genre(): void
    {
        $this->assertEqualsCanonicalizing(['Cyber Drift 2077', 'Sold Out Saga'], $this->names(['platform' => 'Steam']));
        $this->assertSame(['Cyber Drift 2077'], $this->names(['region' => 'Europe']));
        $this->assertSame(['Dragon Keep Legends'], $this->names(['genre' => 'RPG']));
        $this->assertSame(['Cyber Drift 2077'], $this->names(['platform' => 'Steam', 'region' => 'Europe']));
        $this->assertSame([], $this->names(['platform' => 'Nintendo']));
    }

    public function test_it_filters_by_price_using_the_cheapest_in_stock_offer(): void
    {
        $this->assertSame(['Cyber Drift 2077'], $this->names(['min_price' => 2000, 'max_price' => 4500]));
        $this->assertEqualsCanonicalizing(['Cyber Drift 2077', 'Dragon Keep Legends'], $this->names(['min_price' => 2000]));
        $this->assertSame(['Farm Valley Dreams'], $this->names(['max_price' => 2000]));
        // The 3000 offer has no keys and the sold-out game has none either, so neither can match a price filter.
        $this->assertNotContains('Sold Out Saga', $this->names(['max_price' => 100000]));
    }

    public function test_it_sorts_results(): void
    {
        $this->assertSame(['Farm Valley Dreams', 'Cyber Drift 2077', 'Dragon Keep Legends', 'Sold Out Saga'], $this->names(['sort' => 'price_asc']));
        $this->assertSame(['Dragon Keep Legends', 'Cyber Drift 2077', 'Farm Valley Dreams', 'Sold Out Saga'], $this->names(['sort' => 'price_desc']));
        $this->assertSame(['Cyber Drift 2077', 'Dragon Keep Legends', 'Farm Valley Dreams', 'Sold Out Saga'], $this->names(['sort' => 'name']));
        $this->assertSame(['Cyber Drift 2077', 'Farm Valley Dreams'], array_slice($this->names(['sort' => 'discount']), 0, 2));
        $this->assertSame(['Dragon Keep Legends', 'Cyber Drift 2077', 'Farm Valley Dreams', 'Sold Out Saga'], $this->names(), 'default order is popularity');
    }

    public function test_it_paginates(): void
    {
        $page1 = $this->getJson('/api/products?per_page=3&sort=name')->assertOk()
            ->assertJsonPath('meta.total', 4)->assertJsonPath('meta.last_page', 2)->assertJsonPath('meta.page', 1);
        $this->assertCount(3, $page1->json('data'));

        $page2 = $this->getJson('/api/products?per_page=3&sort=name&page=2')->assertOk()->assertJsonPath('meta.page', 2);
        $this->assertSame(['Sold Out Saga'], $page2->json('data.*.name'));
    }

    public function test_invalid_query_parameters_are_rejected(): void
    {
        $this->getJson('/api/products?sort=bogus')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson('/api/products?per_page=1000')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/api/products?min_price=abc')->assertUnprocessable()->assertJsonValidationErrors('min_price');
    }

    public function test_the_filters_endpoint_describes_what_is_in_stock(): void
    {
        $this->getJson('/api/filters')->assertOk()
            ->assertJsonPath('platforms', ['PlayStation', 'Steam', 'Xbox'])
            ->assertJsonPath('regions', ['Europe', 'Global', 'North America'])
            ->assertJsonPath('genres', ['Racing', 'RPG', 'Simulation', 'Strategy'])
            ->assertJsonPath('price.min', 1999)   // 999 and 3000 have no keys
            ->assertJsonPath('price.max', 5999);
    }

    // ---------- Search ----------

    public function test_it_finds_products_by_name(): void
    {
        $this->assertSame(['Dragon Keep Legends'], $this->names(['q' => 'Dragon Keep Legends']));
        $this->assertSame(['Dragon Keep Legends'], $this->names(['q' => 'dragon keep']), 'case-insensitive and partial');
        $this->assertSame(['Farm Valley Dreams'], $this->names(['q' => 'valley']));
    }

    public function test_search_tolerates_typos(): void
    {
        $this->assertSame(['Cyber Drift 2077'], $this->names(['q' => 'cyber dirft']), 'swapped letters');
        $this->assertSame(['Cyber Drift 2077'], $this->names(['q' => 'cybr drift']), 'missing letter');
        $this->assertSame(['Dragon Keep Legends'], $this->names(['q' => 'dragn keep legnds']), 'several typos');
        $this->assertSame(['Farm Valley Dreams'], $this->names(['q' => 'farm vally dreems']), 'wrong vowels');
    }

    public function test_search_matches_partial_names_without_noise(): void
    {
        $this->assertSame(['Dragon Keep Legends'], $this->names(['q' => 'drag']));
        $this->assertSame(['Cyber Drift 2077'], $this->names(['q' => 'cyb']));
    }

    public function test_search_returns_nothing_for_unrelated_text(): void
    {
        $this->assertSame([], $this->names(['q' => 'qqqqzzzz']));
    }

    public function test_search_combines_with_filters_and_ranks_the_best_match_first(): void
    {
        $this->assertSame(['Cyber Drift 2077'], $this->names(['q' => 'cyber', 'platform' => 'Steam']));
        $this->assertSame([], $this->names(['q' => 'cyber', 'platform' => 'Xbox']));

        $this->makeOffer($this->makeProduct(['name' => 'Cyber Racer', 'units_sold' => 9999]), 1500, keys: 2);
        $this->assertSame('Cyber Drift 2077', $this->names(['q' => 'cyber drift'])[0], 'closest name first, even if another game sold more');
    }

    // ---------- Product page ----------

    public function test_the_product_page_shows_in_stock_offers_cheapest_first(): void
    {
        $response = $this->getJson('/api/products/'.$this->cyber->slug)->assertOk()
            ->assertJsonPath('data.name', 'Cyber Drift 2077')
            ->assertJsonPath('data.platform', 'Steam')
            ->assertJsonPath('data.description', 'A test game.')
            ->assertJsonPath('data.price', 3999)
            ->assertJsonCount(2, 'data.offers');

        $this->assertSame([3999, 4500], $response->json('data.offers.*.price'), 'the out-of-stock 3000 offer is hidden');
        $this->assertSame(3, $response->json('data.offers.0.stock'));
        $this->assertSame(5999, $response->json('data.offers.0.old_price'));
        $response->assertJsonStructure(['data' => ['offers' => [['id', 'price', 'old_price', 'stock', 'seller' => ['id', 'name', 'rating']]]]]);
    }

    public function test_a_sold_out_product_still_has_a_page_without_offers(): void
    {
        $this->getJson('/api/products/'.$this->soldOut->slug)->assertOk()
            ->assertJsonPath('data.price', null)
            ->assertJsonCount(0, 'data.offers');
    }

    public function test_an_unknown_product_is_a_plain_404(): void
    {
        $this->getJson('/api/products/does-not-exist')->assertNotFound()->assertExactJson(['message' => 'Not found.']);
    }

    // ---------- Homepage blocks (each has its own endpoint) ----------

    public function test_banners_come_from_the_database_in_order(): void
    {
        Banner::create(['title' => 'Third', 'subtitle' => null, 'color' => '#111111', 'link' => '/store', 'position' => 2]);
        Banner::create(['title' => 'First', 'subtitle' => 'Sub', 'color' => '#222222', 'link' => '/store?sort=discount', 'position' => 0]);
        Banner::create(['title' => 'Second', 'subtitle' => null, 'color' => '#333333', 'link' => '/store', 'position' => 1]);

        $this->getJson('/api/home/banners')->assertOk()
            ->assertJsonPath('data.*.title', ['First', 'Second', 'Third'])
            ->assertJsonPath('data.0.link', '/store?sort=discount')
            ->assertJsonStructure(['data' => [['id', 'title', 'subtitle', 'color', 'link']]]);
    }

    public function test_best_sellers_are_ordered_by_sales_and_skip_products_without_stock(): void
    {
        $this->soldOut->update(['units_sold' => 9999]); // sells most, but has nothing to buy

        $this->getJson('/api/home/best-sellers')->assertOk()
            ->assertJsonPath('data.*.name', ['Dragon Keep Legends', 'Cyber Drift 2077', 'Farm Valley Dreams']);
    }

    public function test_deals_only_contain_discounted_products_biggest_discount_first(): void
    {
        $this->getJson('/api/home/deals')->assertOk()
            ->assertJsonPath('data.*.name', ['Cyber Drift 2077', 'Farm Valley Dreams'])
            ->assertJsonPath('data.0.discount_percent', 33);
    }
}
