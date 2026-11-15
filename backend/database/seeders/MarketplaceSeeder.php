<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Offer;
use App\Models\Product;
use App\Models\Seller;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Fictional games (no real trademarks), sellers, offers and digital keys.
 * Everything is derived from the lists below with a fixed pseudo-random seed,
 * so every environment gets the same data.
 */
class MarketplaceSeeder extends Seeder
{
    /** [name, genre, base price in cents, release year, description] */
    private const GAMES = [
        ['Cyber Drift 2077', 'Racing', 3999, 2024, 'Neon-soaked street racing across a rain-slick megacity. Tune your car and outrun the law.'],
        ['Dragon Keep Legends', 'RPG', 5999, 2023, 'A sprawling fantasy role-playing adventure. Build a party, defend the keep and tame the dragons.'],
        ['Galactic Frontier', 'Strategy', 2999, 2022, 'Build an empire among the stars. Trade, research and fight for control of the galaxy.'],
        ['Pixel Knights', 'Platformer', 1499, 2021, 'A charming retro platformer with tight controls, secret levels and a chiptune soundtrack.'],
        ['Shadow Protocol', 'Action', 4999, 2024, 'Stealth-action thriller. Infiltrate, hack and vanish before the alarms sound.'],
        ['Farm Valley Dreams', 'Simulation', 1999, 2022, 'Grow crops, raise animals and befriend the village in this cozy farming simulator.'],
        ['Skyline Tycoon', 'Simulation', 2499, 2023, 'Design and run your own city. Zoning, traffic and happy citizens are up to you.'],
        ['Iron Legion', 'Shooter', 5499, 2024, 'Squad-based military shooter with large-scale battles and a gripping campaign.'],
        ['Mystic Tides', 'Adventure', 2999, 2022, 'Sail a haunted archipelago, solve ancient puzzles and uncover the secret of the tides.'],
        ['Turbo Kart Rush', 'Racing', 1999, 2023, 'Fast, chaotic kart racing with power-ups, shortcuts and four-player split screen.'],
        ['Last Colony', 'Survival', 3499, 2023, 'Survive on a hostile alien planet. Gather, craft and keep your colony alive.'],
        ['Blade of Eternity', 'Action', 4499, 2021, 'Fast-paced hack and slash across a collapsing timeline. Master combos and parry everything.'],
        ['Puzzle Orbit', 'Puzzle', 999, 2020, 'Relaxing physics puzzles in zero gravity. Hundreds of hand-crafted levels.'],
        ['Zombie Harbor', 'Horror', 2799, 2022, 'A tense co-op horror game set in an abandoned harbor town. Barricade and survive the night.'],
        ['Football Masters 25', 'Sports', 5999, 2025, 'The latest season of arcade football: licensed-free teams, online leagues and career mode.'],
        ['Wizard Academy', 'RPG', 3499, 2024, 'Study spells, make rivals and uncover the dark secret hidden beneath the academy.'],
        ['Neon Samurai', 'Action', 2999, 2023, 'Slice through cyberpunk Tokyo in this stylish side-scrolling action game.'],
        ['Deep Sea Explorer', 'Adventure', 1799, 2021, 'Dive into the abyss, catalogue strange creatures and find the lost submarine.'],
        ['Rogue Galaxy Arena', 'Shooter', 2499, 2024, 'Roguelike arena shooter. Every run is different, every death teaches you something.'],
        ['Castle Defenders', 'Strategy', 1299, 2020, 'Tower defense with a twist: build the castle, then defend it in real time.'],
    ];

    /** Each game is sold for two platform/region combinations, picked by index. */
    private const VARIANTS = [
        ['Steam', 'Global'], ['Steam', 'Europe'], ['PlayStation', 'Europe'], ['PlayStation', 'North America'],
        ['Xbox', 'Global'], ['Xbox', 'North America'], ['Nintendo', 'Global'], ['Epic Games', 'Global'],
    ];

    private const COLORS = ['#4618AC', '#6B3FD4', '#0F8B8D', '#C2185B', '#D84315', '#1565C0', '#2E7D32', '#8E24AA'];

    private const SELLERS = [
        ['KeyHaven', 4.9], ['GameVault', 4.7], ['PixelBazaar', 4.6], ['DigitalDen', 4.8],
        ['LootLane', 4.4], ['QuickKeys', 4.5], ['StarMarket', 4.3],
    ];

    public function run(): void
    {
        if (Product::exists()) {
            return; // already seeded
        }

        mt_srand(42); // fixed seed: same catalog everywhere

        DB::transaction(function () {
            $sellers = collect(self::SELLERS)->map(fn ($s) => Seller::create(['name' => $s[0], 'rating' => $s[1]]));

            foreach (self::GAMES as $i => [$name, $genre, $basePrice, $year, $description]) {
                foreach ([$i % 8, ($i + 3) % 8] as $variantIndex) {
                    [$platform, $region] = self::VARIANTS[$variantIndex];

                    $product = Product::create([
                        'slug' => Str::slug("$name $platform $region"),
                        'name' => $name,
                        'platform' => $platform,
                        'region' => $region,
                        'genre' => $genre,
                        'cover_color' => self::COLORS[($i + $variantIndex) % count(self::COLORS)],
                        'description' => $description,
                        'release_date' => "$year-".str_pad((string) mt_rand(1, 12), 2, '0', STR_PAD_LEFT).'-'.str_pad((string) mt_rand(1, 28), 2, '0', STR_PAD_LEFT),
                        'units_sold' => mt_rand(50, 5000),
                    ]);

                    $this->createOffers($product, $basePrice, $sellers);
                }
            }

            $this->createBanners();
        });
    }

    /** 3-5 sellers per product, with slightly different prices; some offers are discounted. */
    private function createOffers(Product $product, int $basePrice, $sellers): void
    {
        $offerCount = mt_rand(3, 5);
        $chosen = $sellers->shuffle(mt_rand())->take($offerCount);

        foreach ($chosen as $seller) {
            $price = (int) (round($basePrice * mt_rand(80, 105) / 100 / 10) * 10) - 1; // ends in 9
            $discounted = mt_rand(1, 100) <= 45;

            $offer = Offer::create([
                'product_id' => $product->id,
                'seller_id' => $seller->id,
                'price' => $price,
                'old_price' => $discounted ? (int) (round($price * mt_rand(125, 220) / 100 / 10) * 10) - 1 : null,
            ]);

            $keys = [];
            foreach (range(1, mt_rand(4, 12)) as $_) {
                $keys[] = ['offer_id' => $offer->id, 'code' => $this->makeKey(), 'created_at' => now(), 'updated_at' => now()];
            }
            DB::table('game_keys')->insert($keys);
        }
    }

    /** XXXXX-XXXXX-XXXXX from an alphabet without look-alike characters. Uniqueness is enforced by the DB. */
    private function makeKey(): string
    {
        static $used = [];
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        do {
            $groups = [];
            foreach (range(1, 3) as $_) {
                $group = '';
                foreach (range(1, 5) as $__) {
                    $group .= $alphabet[mt_rand(0, strlen($alphabet) - 1)];
                }
                $groups[] = $group;
            }
            $code = implode('-', $groups);
        } while (isset($used[$code]));

        return $used[$code] = $code;
    }

    private function createBanners(): void
    {
        $banners = [
            ['Summer Sale', 'Up to 70% off top games', '#4618AC', '/store?sort=discount'],
            ['New on PlayStation', 'Fresh keys for your console', '#1565C0', '/store?platform=PlayStation'],
            ['Cheapest keys on Steam', 'Compare offers from trusted sellers', '#C2185B', '/store?platform=Steam&sort=price_asc'],
        ];

        foreach ($banners as $position => [$title, $subtitle, $color, $link]) {
            Banner::create(compact('title', 'subtitle', 'color', 'link') + ['position' => $position]);
        }
    }
}
