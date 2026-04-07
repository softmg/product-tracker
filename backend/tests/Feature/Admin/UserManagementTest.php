<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        User::factory()->count(5)->create();

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/admin/users');

        $response
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/admin/users');

        $response->assertForbidden();
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $team = Team::factory()->create();

        $response = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/users', [
                'name' => 'New User',
                'email' => 'new@company.com',
                'password' => 'password123',
                'role' => UserRole::Initiator->value,
                'team_id' => $team->id,
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'new@company.com',
            'role' => UserRole::Initiator->value,
            'team_id' => $team->id,
        ]);
    }

    public function test_admin_can_toggle_user_active(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $user = User::factory()->create([
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->patchJson("/api/v1/admin/users/{$user->id}/toggle-active");

        $response->assertOk();

        $this->assertFalse((bool) $user->fresh()->is_active);
    }

    public function test_user_creation_validates_unique_email(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        User::factory()->create([
            'email' => 'duplicate@company.com',
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/users', [
                'name' => 'Duplicate User',
                'email' => 'duplicate@company.com',
                'password' => 'password123',
                'role' => UserRole::Analyst->value,
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }
}
