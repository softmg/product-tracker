<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\Hypothesis;
use App\Models\StatusTransition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatusTransitionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_available_transitions(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Initiator->value],
            'condition_type' => 'none',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/transitions");

        $response
            ->assertOk()
            ->assertJsonPath('data.0.to_status', HypothesisStatus::Scoring->value);
    }

    public function test_user_can_transition_when_rules_allow(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Initiator->value],
            'condition_type' => 'none',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
                'comment' => 'Move forward',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.status', HypothesisStatus::Scoring->value);
    }

    public function test_transition_returns_403_for_disallowed_role(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::PdManager->value],
            'condition_type' => 'none',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
            ]);

        $response->assertForbidden();
    }

    public function test_transition_returns_422_when_condition_not_met(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
            'problem' => null,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'required_fields',
            'condition_value' => 'title,problem',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
            ]);

        $response->assertStatus(422);
    }

    public function test_unauthenticated_user_cannot_access_transition_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/transitions")->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
            'to_status' => HypothesisStatus::Scoring->value,
        ])->assertUnauthorized();
    }
}
