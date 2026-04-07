<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/v1/auth/logout');

        $response
            ->assertOk()
            ->assertJson(['message' => 'Logged out']);
    }

    public function test_guest_cannot_logout(): void
    {
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
    }
}
