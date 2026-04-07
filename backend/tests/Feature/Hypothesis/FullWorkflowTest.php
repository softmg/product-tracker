<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\CommitteeMember;
use App\Models\DeepDiveStage;
use App\Models\Hypothesis;
use App\Models\ScoringCriterion;
use App\Models\StatusTransition;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FullWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $initiator;
    private User $pdManager;
    private User $analyst;
    private User $committeeMember1;
    private User $committeeMember2;
    private Team $team;

    protected function setUp(): void
    {
        parent::setUp();

        $this->team = Team::factory()->create(['name' => 'Growth']);

        $this->admin = User::factory()->create([
            'role' => UserRole::Admin,
            'team_id' => $this->team->id,
        ]);
        $this->initiator = User::factory()->create([
            'role' => UserRole::Initiator,
            'team_id' => $this->team->id,
        ]);
        $this->pdManager = User::factory()->create([
            'role' => UserRole::PdManager,
            'team_id' => $this->team->id,
        ]);
        $this->analyst = User::factory()->create([
            'role' => UserRole::Analyst,
            'team_id' => $this->team->id,
        ]);
        $this->committeeMember1 = User::factory()->create([
            'role' => UserRole::Committee,
            'team_id' => $this->team->id,
        ]);
        $this->committeeMember2 = User::factory()->create([
            'role' => UserRole::Committee,
            'team_id' => $this->team->id,
        ]);
    }

    public function test_hypothesis_can_be_created_by_initiator(): void
    {
        $response = $this->actingAs($this->initiator, 'web')
            ->postJson('/api/v1/hypotheses', [
                'title' => 'Full workflow test hypothesis',
                'description' => 'Testing the full workflow',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', HypothesisStatus::Backlog->value)
            ->assertJsonPath('data.title', 'Full workflow test hypothesis');
    }

    public function test_hypothesis_transitions_from_backlog_to_scoring(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
            'initiator_id' => $this->initiator->id,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Initiator->value, UserRole::PdManager->value],
            'condition_type' => 'none',
        ]);

        $response = $this->actingAs($this->initiator, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
                'comment' => 'Ready for scoring',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', HypothesisStatus::Scoring->value);
    }

    public function test_scoring_submission_calculates_total_score(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Scoring,
        ]);

        $criterion1 = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 2.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $criterion2 = ScoringCriterion::factory()->create([
            'stage' => 'primary',
            'weight' => 1.0,
            'is_stop_factor' => false,
            'input_type' => 'slider',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->analyst, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/scoring/primary", [
                'criteria_scores' => [
                    $criterion1->id => 4,
                    $criterion2->id => 3,
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('data.stage', 'primary')
            ->assertJsonStructure(['data' => ['total_score', 'criteria_scores']]);
    }

    public function test_hypothesis_transitions_from_scoring_to_deep_dive(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Scoring,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Scoring->value,
            'to_status' => HypothesisStatus::DeepDive->value,
            'allowed_roles' => [UserRole::PdManager->value, UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $response = $this->actingAs($this->pdManager, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::DeepDive->value,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', HypothesisStatus::DeepDive->value);
    }

    public function test_deep_dive_stages_can_be_toggled(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::DeepDive,
        ]);

        // Create a global deep dive stage (not tied to hypothesis_deep_dive_id)
        $stage = DeepDiveStage::factory()->create([
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->pdManager, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesis->id}/deep-dive/{$stage->id}", [
                'is_completed' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_completed', true);
    }

    public function test_hypothesis_transitions_to_experiment(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::DeepDive,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::DeepDive->value,
            'to_status' => HypothesisStatus::Experiment->value,
            'allowed_roles' => [UserRole::PdManager->value, UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $response = $this->actingAs($this->pdManager, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Experiment->value,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', HypothesisStatus::Experiment->value);
    }

    public function test_experiment_can_be_created_and_completed(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Experiment,
        ]);

        $createResponse = $this->actingAs($this->analyst, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
                'title' => 'A/B test for hypothesis',
                'description' => 'Testing variant A vs B',
                'type' => 'a_b_test',
            ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.status', 'planned');

        $experimentId = $createResponse->json('data.id');

        $resultResponse = $this->actingAs($this->analyst, 'web')
            ->patchJson("/api/v1/experiments/{$experimentId}/result", [
                'result' => 'success',
                'result_notes' => 'Variant A won by 15%',
            ]);

        $resultResponse->assertOk()
            ->assertJsonPath('data.result', 'success');
    }

    public function test_hypothesis_transitions_to_go_no_go(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Experiment,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Experiment->value,
            'to_status' => HypothesisStatus::GoNoGo->value,
            'allowed_roles' => [UserRole::PdManager->value, UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $response = $this->actingAs($this->pdManager, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::GoNoGo->value,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', HypothesisStatus::GoNoGo->value);
    }

    public function test_committee_members_can_vote(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        // Committee members are global records (no hypothesis_id)
        $member1 = CommitteeMember::factory()->create([
            'user_id' => $this->committeeMember1->id,
            'is_active' => true,
        ]);

        $vote1Response = $this->actingAs($this->committeeMember1, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/votes", [
                'vote' => 'go',
                'comment' => 'Strong potential',
            ]);

        $vote1Response->assertCreated()
            ->assertJsonPath('data.vote', 'go');
    }

    public function test_audit_log_records_transitions(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $this->actingAs($this->admin, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
            ]);

        $auditResponse = $this->actingAs($this->admin, 'web')
            ->getJson("/api/v1/audit-log?entity_id={$hypothesis->id}");

        $auditResponse->assertOk();
        $this->assertGreaterThanOrEqual(1, count($auditResponse->json('data')));
    }
}
