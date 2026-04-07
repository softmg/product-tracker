<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Models\Hypothesis;
use App\Models\HypothesisScoring;
use App\Models\ScoringCriterion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScoringTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_primary_scoring(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $firstCriterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 2.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $secondCriterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 1.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $stopFactorCriterion = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 0,
            'is_stop_factor' => true,
            'input_type' => 'checkbox',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/scoring/primary", [
                'criteria_scores' => [
                    $firstCriterion->id => 4,
                    $secondCriterion->id => 2,
                    $stopFactorCriterion->id => 1,
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.stage', 'primary')
            ->assertJsonPath('data.stop_factor_triggered', true);

        $this->assertEquals(3.33, (float) $response->json('data.total_score'));

        $scoring = HypothesisScoring::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->where('stage', 'primary')
            ->firstOrFail();

        $this->assertEquals(3.33, (float) $scoring->total_score);
        $this->assertTrue((bool) $scoring->stop_factor_triggered);
        $this->assertSame($user->id, $scoring->scored_by);
        $this->assertEquals(3.33, (float) $hypothesis->fresh()->scoring_primary);
    }

    public function test_user_can_get_existing_scoring_for_stage(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $scoring = HypothesisScoring::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage' => 'primary',
            'total_score' => 4.25,
            'scored_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/scoring/primary");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $scoring->id)
            ->assertJsonPath('data.stage', 'primary');

        $this->assertEquals(4.25, (float) $response->json('data.total_score'));
    }

    public function test_scoring_criteria_endpoint_returns_active_criteria_for_stage(): void
    {
        $user = User::factory()->create();

        $activePrimary = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'is_active' => true,
            'order' => 1,
        ]);

        ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'is_active' => false,
            'order' => 2,
        ]);

        ScoringCriterion::factory()->create([
            'stage' => 'deep',
            'is_active' => true,
            'order' => 1,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/scoring-criteria?stage=primary');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activePrimary->id)
            ->assertJsonPath('data.0.stage', 'primary');
    }

    public function test_user_can_submit_deep_scoring(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $criterion = ScoringCriterion::factory()->create([
            'stage' => 'deep',
            'weight' => 1.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/scoring/deep", [
                'criteria_scores' => [
                    $criterion->id => 5,
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.stage', 'deep');

        $this->assertEquals(5.0, (float) $hypothesis->fresh()->scoring_deep);
    }

    public function test_unauthenticated_user_cannot_access_scoring_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();

        $this->getJson('/api/v1/scoring-criteria?stage=primary')->assertUnauthorized();
        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/scoring/primary")->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/scoring/primary", [
            'criteria_scores' => [1 => 3],
        ])->assertUnauthorized();
    }
}
