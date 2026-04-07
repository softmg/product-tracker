<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\Hypothesis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HypothesisCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_hypotheses(): void
    {
        $user = User::factory()->create();
        Hypothesis::factory()->count(3)->create();

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/hypotheses');

        $response
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_user_can_create_hypothesis(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/v1/hypotheses', [
                'title' => 'Test hypothesis',
                'description' => 'Test description',
                'problem' => 'Test problem',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.status', HypothesisStatus::Backlog->value)
            ->assertJsonPath('data.initiator.id', $user->id);

        $this->assertStringStartsWith('HYP-', $response->json('data.code'));
    }

    public function test_hypothesis_code_auto_increments(): void
    {
        $user = User::factory()->create();

        Hypothesis::factory()->create([
            'code' => 'HYP-005',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/v1/hypotheses', [
                'title' => 'Next hypothesis',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.code', 'HYP-006');
    }

    public function test_hypotheses_can_be_filtered_by_status(): void
    {
        $user = User::factory()->create();

        Hypothesis::factory()->count(2)->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        Hypothesis::factory()->count(3)->create([
            'status' => HypothesisStatus::Scoring,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/hypotheses?status=backlog');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_unauthenticated_user_cannot_access_hypotheses(): void
    {
        $this->getJson('/api/v1/hypotheses')->assertUnauthorized();
    }
}
