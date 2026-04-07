<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Enums\UserRole;
use App\Models\DeepDiveStage;
use App\Models\Hypothesis;
use App\Models\HypothesisDeepDive;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeepDiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_deep_dive_checklist_for_hypothesis(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $firstStage = DeepDiveStage::factory()->create([
            'is_active' => true,
            'order' => 1,
            'is_required' => true,
        ]);

        $secondStage = DeepDiveStage::factory()->create([
            'is_active' => true,
            'order' => 2,
            'is_required' => false,
        ]);

        HypothesisDeepDive::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage_id' => $firstStage->id,
            'is_completed' => true,
            'completed_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.stage.id', $firstStage->id)
            ->assertJsonPath('data.0.is_completed', true)
            ->assertJsonPath('data.1.stage.id', $secondStage->id)
            ->assertJsonPath('data.1.is_completed', false);
    }

    public function test_user_can_mark_deep_dive_stage_completed(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();
        $stage = DeepDiveStage::factory()->create([
            'is_active' => true,
            'is_required' => true,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}", [
                'is_completed' => true,
                'comment' => 'Done with interviews',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.stage.id', $stage->id)
            ->assertJsonPath('data.is_completed', true);

        $record = HypothesisDeepDive::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->where('stage_id', $stage->id)
            ->firstOrFail();

        $this->assertTrue((bool) $record->is_completed);
        $this->assertSame($user->id, $record->completed_by);
        $this->assertNotNull($record->completed_at);
        $this->assertNotEmpty($record->comments);
    }

    public function test_user_can_add_comment_to_deep_dive_stage(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();
        $stage = DeepDiveStage::factory()->create(['is_active' => true]);

        HypothesisDeepDive::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage_id' => $stage->id,
            'comments' => [],
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}/comments", [
                'text' => 'Need one more interview for confidence',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.stage.id', $stage->id)
            ->assertJsonPath('data.comments.0.text', 'Need one more interview for confidence');
    }

    public function test_deep_dive_progress_returns_totals_and_required_completion(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $requiredCompleted = DeepDiveStage::factory()->create([
            'is_active' => true,
            'is_required' => true,
            'order' => 1,
        ]);

        $requiredPending = DeepDiveStage::factory()->create([
            'is_active' => true,
            'is_required' => true,
            'order' => 2,
        ]);

        $optionalCompleted = DeepDiveStage::factory()->create([
            'is_active' => true,
            'is_required' => false,
            'order' => 3,
        ]);

        HypothesisDeepDive::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage_id' => $requiredCompleted->id,
            'is_completed' => true,
            'completed_by' => $user->id,
        ]);

        HypothesisDeepDive::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage_id' => $optionalCompleted->id,
            'is_completed' => true,
            'completed_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/progress");

        $response
            ->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.completed', 2)
            ->assertJsonPath('data.required_total', 2)
            ->assertJsonPath('data.required_completed', 1);

        $this->assertDatabaseHas('hypothesis_deep_dives', [
            'hypothesis_id' => $hypothesis->id,
            'stage_id' => $requiredPending->id,
            'is_completed' => false,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_deep_dive_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();
        $stage = DeepDiveStage::factory()->create();

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive")->assertUnauthorized();
        $this->putJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}", [
            'is_completed' => true,
        ])->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}/comments", [
            'text' => 'Comment',
        ])->assertUnauthorized();
        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/progress")->assertUnauthorized();
    }

    public function test_update_requires_boolean_is_completed(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PdManager,
        ]);

        $hypothesis = Hypothesis::factory()->create();
        $stage = DeepDiveStage::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}", [
                'is_completed' => 'yes',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('is_completed');
    }

    public function test_comment_endpoint_requires_text(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();
        $stage = DeepDiveStage::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}/comments", []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('text');
    }
}
