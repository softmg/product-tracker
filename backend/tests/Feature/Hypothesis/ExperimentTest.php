<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Models\Experiment;
use App\Models\ExperimentMetric;
use App\Models\Hypothesis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExperimentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_hypothesis_experiments(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $experiment = Experiment::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'created_by' => $user->id,
            'title' => 'Landing page test',
        ]);

        ExperimentMetric::factory()->create([
            'experiment_id' => $experiment->id,
            'name' => 'conversion_rate',
        ]);

        Experiment::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/experiments");

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $experiment->id)
            ->assertJsonPath('data.0.title', 'Landing page test')
            ->assertJsonCount(1, 'data.0.metrics');
    }

    public function test_user_can_create_experiment_with_metrics(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
                'title' => 'Landing page test',
                'type' => 'a_b_test',
                'description' => 'Test conversion',
                'start_date' => '2026-04-10',
                'end_date' => '2026-04-20',
                'metrics' => [
                    ['name' => 'Conversion rate', 'target_value' => 5, 'unit' => '%'],
                    ['name' => 'Signups', 'target_value' => 100, 'unit' => 'qty'],
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.title', 'Landing page test')
            ->assertJsonPath('data.type', 'a_b_test')
            ->assertJsonCount(2, 'data.metrics');

        $experimentId = (int) $response->json('data.id');

        $this->assertDatabaseHas('experiments', [
            'id' => $experimentId,
            'hypothesis_id' => $hypothesis->id,
            'title' => 'Landing page test',
            'created_by' => $user->id,
        ]);

        $this->assertDatabaseCount('experiment_metrics', 2);
    }

    public function test_user_can_update_experiment_and_replace_metrics(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $experiment = Experiment::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'created_by' => $user->id,
            'title' => 'Old title',
            'type' => 'interview',
        ]);

        $existingMetric = ExperimentMetric::factory()->create([
            'experiment_id' => $experiment->id,
            'name' => 'Old metric',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experiment->id}", [
                'title' => 'Updated title',
                'type' => 'prototype',
                'metrics' => [
                    ['name' => 'Activation rate', 'target_value' => 25, 'unit' => '%'],
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated title')
            ->assertJsonPath('data.type', 'prototype')
            ->assertJsonCount(1, 'data.metrics')
            ->assertJsonPath('data.metrics.0.name', 'Activation rate');

        $this->assertDatabaseMissing('experiment_metrics', [
            'id' => $existingMetric->id,
        ]);
    }

    public function test_user_can_delete_experiment(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $experiment = Experiment::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'created_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experiment->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('experiments', [
            'id' => $experiment->id,
        ]);
    }

    public function test_user_can_update_experiment_result(): void
    {
        $user = User::factory()->create();
        $experiment = Experiment::factory()->create([
            'created_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->patchJson("/api/v1/experiments/{$experiment->id}/result", [
                'result' => 'success',
                'what_worked' => 'High conversion on variant B',
                'what_not_worked' => 'Low retention after signup',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $experiment->id)
            ->assertJsonPath('data.result', 'success');

        $this->assertDatabaseHas('experiments', [
            'id' => $experiment->id,
            'result' => 'success',
            'what_worked' => 'High conversion on variant B',
            'what_not_worked' => 'Low retention after signup',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_experiment_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();
        $experiment = Experiment::factory()->create([
            'hypothesis_id' => $hypothesis->id,
        ]);

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/experiments")->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
            'title' => 'Landing page test',
            'type' => 'a_b_test',
        ])->assertUnauthorized();
        $this->putJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experiment->id}", [
            'title' => 'Updated',
        ])->assertUnauthorized();
        $this->deleteJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experiment->id}")->assertUnauthorized();
        $this->patchJson("/api/v1/experiments/{$experiment->id}/result", [
            'result' => 'success',
        ])->assertUnauthorized();
    }
}
