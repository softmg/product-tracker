<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FullAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    }

    public function test_admin_can_list_all_users(): void
    {
        User::factory()->count(5)->create();

        $response = $this->actingAs($this->admin, 'web')
            ->getJson('/api/v1/admin/users');

        $response->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'email', 'role', 'is_active']]]);
    }

    public function test_admin_can_create_user(): void
    {
        $team = Team::factory()->create();

        $response = $this->actingAs($this->admin, 'web')
            ->postJson('/api/v1/admin/users', [
                'name' => 'New User',
                'email' => 'new@company.com',
                'password' => 'password123',
                'role' => UserRole::Analyst->value,
                'team_id' => $team->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'new@company.com')
            ->assertJsonPath('data.role', UserRole::Analyst->value);
    }

    public function test_admin_can_update_user(): void
    {
        $user = User::factory()->create(['role' => UserRole::Initiator]);

        $response = $this->actingAs($this->admin, 'web')
            ->putJson("/api/v1/admin/users/{$user->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Name');
    }

    public function test_admin_can_toggle_user_active_status(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $deactivateResponse = $this->actingAs($this->admin, 'web')
            ->patchJson("/api/v1/admin/users/{$user->id}/toggle-active");

        $deactivateResponse->assertOk()
            ->assertJsonPath('data.is_active', false);

        $reactivateResponse = $this->actingAs($this->admin, 'web')
            ->patchJson("/api/v1/admin/users/{$user->id}/toggle-active");

        $reactivateResponse->assertOk()
            ->assertJsonPath('data.is_active', true);
    }

    public function test_admin_can_manage_teams(): void
    {
        // Create
        $createResponse = $this->actingAs($this->admin, 'web')
            ->postJson('/api/v1/admin/teams', [
                'name' => 'New Team',
                'description' => 'A test team',
            ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.name', 'New Team');

        $teamId = $createResponse->json('data.id');

        // Update
        $updateResponse = $this->actingAs($this->admin, 'web')
            ->putJson("/api/v1/admin/teams/{$teamId}", [
                'name' => 'Updated Team',
            ]);

        $updateResponse->assertOk()
            ->assertJsonPath('data.name', 'Updated Team');

        // List
        $listResponse = $this->actingAs($this->admin, 'web')
            ->getJson('/api/v1/admin/teams');

        $listResponse->assertOk();
    }

    public function test_admin_can_manage_status_transitions(): void
    {
        // Create
        $createResponse = $this->actingAs($this->admin, 'web')
            ->postJson('/api/v1/admin/status-transitions', [
                'from_status' => 'backlog',
                'to_status' => 'scoring',
                'allowed_roles' => ['initiator', 'pd_manager'],
                'label' => 'Send to Scoring',
                'condition_type' => 'none',
            ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.from_status', 'backlog');

        $transitionId = $createResponse->json('data.id');

        // Update
        $updateResponse = $this->actingAs($this->admin, 'web')
            ->putJson("/api/v1/admin/status-transitions/{$transitionId}", [
                'allowed_roles' => ['initiator'],
            ]);

        $updateResponse->assertOk()
            ->assertJsonPath('data.allowed_roles.0', 'initiator');

        // Delete
        $deleteResponse = $this->actingAs($this->admin, 'web')
            ->deleteJson("/api/v1/admin/status-transitions/{$transitionId}");

        $deleteResponse->assertNoContent();
    }

    public function test_admin_can_read_audit_log(): void
    {
        $response = $this->actingAs($this->admin, 'web')
            ->getJson('/api/v1/audit-log');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_non_admin_cannot_perform_admin_operations(): void
    {
        $analyst = User::factory()->create(['role' => UserRole::Analyst]);

        $this->actingAs($analyst, 'web')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();

        $this->actingAs($analyst, 'web')
            ->postJson('/api/v1/admin/users', ['name' => 'x'])
            ->assertForbidden();

        $this->actingAs($analyst, 'web')
            ->getJson('/api/v1/admin/teams')
            ->assertForbidden();
    }
}
