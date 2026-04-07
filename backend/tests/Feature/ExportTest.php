<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\HypothesisStatus;
use App\Models\Experiment;
use App\Models\Hypothesis;
use App\Models\HypothesisDeepDive;
use App\Models\HypothesisScoring;
use App\Models\Respondent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_export_hypothesis_pdf_passport(): void
    {
        $user = User::factory()->create();

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::DeepDive,
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
        ]);

        HypothesisScoring::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage' => 'primary',
            'total_score' => 8.2,
            'scored_by' => $user->id,
        ]);

        HypothesisDeepDive::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'is_completed' => true,
            'completed_by' => $user->id,
        ]);

        Experiment::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'created_by' => $user->id,
            'responsible_user_id' => $user->id,
        ]);

        Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->get("/api/v1/hypotheses/{$hypothesis->id}/export/pdf");

        $response
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_user_can_export_hypothesis_excel(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->get("/api/v1/hypotheses/{$hypothesis->id}/export/excel");

        $response
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_unauthenticated_user_cannot_access_export_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/export/pdf")->assertUnauthorized();
        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/export/excel")->assertUnauthorized();
    }
}
