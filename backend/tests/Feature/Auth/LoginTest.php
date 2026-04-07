<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'email', 'name', 'role', 'team_id', 'is_active'],
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'wrong@test.com',
            'password' => 'wrong',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }
}
