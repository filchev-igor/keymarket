<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_register_and_gets_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ann', 'email' => 'ann@example.com', 'password' => 'secret123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'ann@example.com')
            ->assertJsonPath('user.name', 'Ann')
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token'])
            ->assertJsonMissingPath('user.password');

        $user = User::where('email', 'ann@example.com')->firstOrFail();
        $this->assertNotSame('secret123', $user->password, 'the password must be stored hashed');
        $this->assertTrue(Hash::check('secret123', $user->password));
    }

    public function test_registration_is_validated(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/auth/register', ['name' => 'X', 'email' => 'taken@example.com', 'password' => 'secret123'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/api/auth/register', ['name' => 'X', 'email' => 'new@example.com', 'password' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->postJson('/api/auth/register', [])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_a_user_can_sign_in_and_use_the_token(): void
    {
        User::factory()->create(['email' => 'ann@example.com', 'password' => 'secret123']);

        $token = $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonPath('user.email', 'ann@example.com')
            ->json('token');

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'ann@example.com');
    }

    public function test_wrong_credentials_are_rejected(): void
    {
        User::factory()->create(['email' => 'ann@example.com', 'password' => 'secret123']);

        $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'wrong-password'])
            ->assertUnprocessable()->assertJsonPath('message', 'Invalid credentials.');

        $this->postJson('/api/auth/login', ['email' => 'nobody@example.com', 'password' => 'secret123'])
            ->assertUnprocessable()->assertJsonPath('message', 'Invalid credentials.');
    }

    public function test_protected_routes_reject_guests(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
        $this->postJson('/api/auth/logout')->assertUnauthorized();
        $this->getJson('/api/orders')->assertUnauthorized();
        $this->getJson('/api/orders/1')->assertUnauthorized();
        $this->postJson('/api/checkout', ['items' => [['offer_id' => 1, 'quantity' => 1]], 'payment' => ['card_number' => '4242424242424242']])
            ->assertUnauthorized();
    }

    public function test_an_invalid_token_is_rejected(): void
    {
        $this->withToken('1|not-a-real-token')->getJson('/api/orders')->assertUnauthorized();
    }

    public function test_logging_out_revokes_the_token(): void
    {
        User::factory()->create(['email' => 'ann@example.com', 'password' => 'secret123']);
        $token = $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'secret123'])->json('token');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
