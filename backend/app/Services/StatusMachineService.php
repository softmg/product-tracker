<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Events\HypothesisStatusChanged;
use App\Models\DeepDiveStage;
use App\Models\Hypothesis;
use App\Models\HypothesisDeepDive;
use App\Models\HypothesisStatusHistory;
use App\Models\ScoringThresholdConfig;
use App\Models\SlaConfig;
use App\Models\StatusTransition;
use App\Models\User;
use DomainException;
use Illuminate\Support\Collection;

class StatusMachineService
{
    /**
     * @return Collection<int, StatusTransition>
     */
    public function getAvailableTransitions(Hypothesis $hypothesis, User $user): Collection
    {
        return StatusTransition::query()
            ->where('from_status', $hypothesis->status->value)
            ->where('is_active', true)
            ->get()
            ->filter(fn (StatusTransition $transition): bool => $this->isRoleAllowed($transition, $user))
            ->filter(fn (StatusTransition $transition): bool => $this->isConditionMet($transition, $hypothesis))
            ->values();
    }

    /**
     * @throws DomainException
     */
    public function transition(Hypothesis $hypothesis, HypothesisStatus $toStatus, User $user, ?string $comment = null): Hypothesis
    {
        $transition = StatusTransition::query()
            ->where('from_status', $hypothesis->status->value)
            ->where('to_status', $toStatus->value)
            ->where('is_active', true)
            ->first();

        if (! $transition) {
            throw new DomainException("Transition from {$hypothesis->status->value} to {$toStatus->value} is not configured.");
        }

        if (! $this->isRoleAllowed($transition, $user)) {
            throw new DomainException("User role {$user->role->value} is not allowed for this transition.");
        }

        if (! $this->isConditionMet($transition, $hypothesis)) {
            throw new DomainException("Transition condition not met: {$transition->condition_type}");
        }

        $fromStatus = $hypothesis->status;

        $hypothesis->update([
            'status' => $toStatus,
            'sla_deadline' => $this->calculateSlaDeadline($toStatus),
            'sla_status' => 'ok',
        ]);

        HypothesisStatusHistory::query()->create([
            'hypothesis_id' => $hypothesis->id,
            'from_status' => $fromStatus->value,
            'to_status' => $toStatus->value,
            'changed_by' => $user->id,
            'comment' => $comment,
        ]);

        event(new HypothesisStatusChanged($hypothesis->fresh(), $fromStatus, $toStatus, $user));

        return $hypothesis->fresh();
    }

    private function isRoleAllowed(StatusTransition $transition, User $user): bool
    {
        $allowedRoles = $transition->allowed_roles ?? [];

        return in_array($user->role->value, $allowedRoles, true)
            || $user->role === UserRole::Admin;
    }

    private function isConditionMet(StatusTransition $transition, Hypothesis $hypothesis): bool
    {
        return match ($transition->condition_type) {
            'none' => true,
            'required_fields' => $this->checkRequiredFields($hypothesis, $transition->condition_value),
            'scoring_threshold' => $this->checkScoringThreshold($hypothesis, $transition),
            'checklist_closed' => $this->checkChecklistClosed($hypothesis),
            default => true,
        };
    }

    private function checkRequiredFields(Hypothesis $hypothesis, ?string $fieldList): bool
    {
        if (! $fieldList) {
            return true;
        }

        $fields = array_map('trim', explode(',', $fieldList));

        foreach ($fields as $field) {
            if (! $hypothesis->{$field}) {
                return false;
            }
        }

        return true;
    }

    private function checkScoringThreshold(Hypothesis $hypothesis, StatusTransition $transition): bool
    {
        $config = ScoringThresholdConfig::query()->first();

        if (! $config) {
            return true;
        }

        if ($transition->to_status === HypothesisStatus::DeepDive->value) {
            return $hypothesis->scoring_primary !== null
                && (float) $hypothesis->scoring_primary >= (float) $config->primary_threshold;
        }

        if ($transition->from_status === HypothesisStatus::DeepDive->value) {
            return $hypothesis->scoring_deep !== null
                && (float) $hypothesis->scoring_deep >= (float) $config->deep_threshold;
        }

        return true;
    }

    private function checkChecklistClosed(Hypothesis $hypothesis): bool
    {
        $requiredStages = DeepDiveStage::query()
            ->where('is_active', true)
            ->where('is_required', true)
            ->count();

        if ($requiredStages === 0) {
            return true;
        }

        $completedStages = HypothesisDeepDive::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->where('is_completed', true)
            ->count();

        return $completedStages >= $requiredStages;
    }

    private function calculateSlaDeadline(HypothesisStatus $status): ?string
    {
        $sla = SlaConfig::query()
            ->where('status', $status->value)
            ->where('is_active', true)
            ->first();

        if (! $sla) {
            return null;
        }

        return now()->addDays($sla->limit_days)->toDateTimeString();
    }
}
