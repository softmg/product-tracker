<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_setup_status_is_true_when_no_users_exist(): void
    {
        $this->getJson('/api/v1/setup/status')
            ->assertOk()
            ->assertJson(['needs_setup' => true]);
    }

    public function test_setup_status_is_false_when_users_exist(): void
    {
        User::factory()->create();

        $this->getJson('/api/v1/setup/status')
            ->assertOk()
            ->assertJson(['needs_setup' => false]);
    }

    public function test_can_create_first_admin_when_database_is_empty(): void
    {
        $response = $this->postJson('/api/v1/setup/admin', [
            'name' => 'First Admin',
            'email' => 'admin@company.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Admin account created successfully.')
            ->assertJsonPath('user.email', 'admin@company.com')
            ->assertJsonPath('user.role', 'admin');

        $this->assertDatabaseHas('users', [
            'email' => 'admin@company.com',
            'role' => UserRole::Admin->value,
            'is_active' => true,
        ]);
    }

    public function test_admin_created_via_setup_can_login(): void
    {
        $this->postJson('/api/v1/setup/admin', [
            'name' => 'First Admin',
            'email' => 'admin@company.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@company.com',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@company.com')
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_setup_admin_returns_forbidden_when_users_already_exist(): void
    {
        User::factory()->create();

        $this->postJson('/api/v1/setup/admin', [
            'name' => 'Another Admin',
            'email' => 'another-admin@company.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Setup already completed. The system already has users.');
    }
}
