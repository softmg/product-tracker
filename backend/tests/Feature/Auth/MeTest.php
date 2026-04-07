<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/auth/me');

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_unauthenticated_user_gets_401(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }
}
