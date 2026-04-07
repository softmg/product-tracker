<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Events\HypothesisStatusChanged;
use App\Models\DeepDiveStage;
use App\Models\Hypothesis;
use App\Models\HypothesisDeepDive;
use App\Models\ScoringThresholdConfig;
use App\Models\SlaConfig;
use App\Models\StatusTransition;
use App\Models\User;
use App\Services\StatusMachineService;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class StatusMachineServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_transition_on_valid_path(): void
    {
        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Initiator->value, UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        $result = (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user);

        $this->assertEquals(HypothesisStatus::Scoring, $result->status);
    }

    public function test_transition_denied_for_wrong_role(): void
    {
        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::PdManager->value],
            'condition_type' => 'none',
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        $this->expectException(DomainException::class);

        (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user);
    }

    public function test_transition_denied_when_scoring_threshold_not_met(): void
    {
        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Scoring->value,
            'to_status' => HypothesisStatus::DeepDive->value,
            'allowed_roles' => [UserRole::PdManager->value],
            'condition_type' => 'scoring_threshold',
        ]);

        ScoringThresholdConfig::factory()->create([
            'primary_threshold' => 7.0,
            'deep_threshold' => 7.0,
        ]);

        $user = User::factory()->create([
            'role' => UserRole::PdManager,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Scoring,
            'scoring_primary' => 5.0,
        ]);

        $this->expectException(DomainException::class);

        (new StatusMachineService())->transition($hypothesis, HypothesisStatus::DeepDive, $user);
    }

    public function test_transition_denied_when_required_fields_missing(): void
    {
        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'required_fields',
            'condition_value' => 'title,problem,solution,target_audience',
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
            'problem' => null,
        ]);

        $this->expectException(DomainException::class);

        (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user);
    }

    public function test_transition_denied_when_required_checklist_not_completed(): void
    {
        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::DeepDive->value,
            'to_status' => HypothesisStatus::Experiment->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'checklist_closed',
        ]);

        DeepDiveStage::factory()->count(2)->create([
            'is_active' => true,
            'is_required' => true,
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::DeepDive,
        ]);

        HypothesisDeepDive::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'is_completed' => true,
        ]);

        $this->expectException(DomainException::class);

        (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Experiment, $user);
    }

    public function test_status_history_recorded_on_transition(): void
    {
        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user, 'Moving to scoring');

        $this->assertDatabaseHas('hypothesis_status_history', [
            'hypothesis_id' => $hypothesis->id,
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'comment' => 'Moving to scoring',
        ]);
    }

    public function test_sla_deadline_calculated_on_transition(): void
    {
        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        SlaConfig::query()->create([
            'status' => HypothesisStatus::Scoring,
            'limit_days' => 7,
            'warning_days' => 5,
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        $result = (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user);

        $this->assertNotNull($result->sla_deadline);
        $this->assertSame('ok', $result->sla_status);
    }

    public function test_status_change_event_dispatched_on_transition(): void
    {
        Event::fake([HypothesisStatusChanged::class]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        (new StatusMachineService())->transition($hypothesis, HypothesisStatus::Scoring, $user);

        Event::assertDispatched(HypothesisStatusChanged::class);
    }
}
