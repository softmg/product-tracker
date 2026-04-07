<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_teams_with_member_count(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $team = Team::factory()->create();
        User::factory()->create(['team_id' => $team->id]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/admin/teams');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.member_count', 1);
    }

    public function test_admin_can_create_team(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/teams', [
                'name' => 'Research',
                'description' => 'Research team',
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('teams', [
            'name' => 'Research',
        ]);
    }

    public function test_team_deletion_blocked_when_team_has_users(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $team = Team::factory()->create();
        User::factory()->create(['team_id' => $team->id]);

        $response = $this
            ->actingAs($admin, 'web')
            ->deleteJson("/api/v1/admin/teams/{$team->id}");

        $response->assertStatus(422);

        $this->assertDatabaseHas('teams', [
            'id' => $team->id,
        ]);
    }

    public function test_non_admin_cannot_manage_teams(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/admin/teams');

        $response->assertForbidden();
    }
}
