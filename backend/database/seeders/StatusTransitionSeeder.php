<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\StatusTransition;
use Illuminate\Database\Seeder;

class StatusTransitionSeeder extends Seeder
{
    public function run(): void
    {
        $transitions = [
            [
                'from_status' => HypothesisStatus::Backlog->value,
                'to_status' => HypothesisStatus::Scoring->value,
                'allowed_roles' => [UserRole::Initiator->value, UserRole::PdManager->value, UserRole::Admin->value],
                'condition_type' => 'required_fields',
                'condition_value' => 'title,problem,solution,target_audience',
            ],
            [
                'from_status' => HypothesisStatus::Scoring->value,
                'to_status' => HypothesisStatus::DeepDive->value,
                'allowed_roles' => [UserRole::PdManager->value, UserRole::Analyst->value, UserRole::Admin->value],
                'condition_type' => 'scoring_threshold',
                'condition_value' => '7.0',
            ],
            [
                'from_status' => HypothesisStatus::DeepDive->value,
                'to_status' => HypothesisStatus::Experiment->value,
                'allowed_roles' => [UserRole::PdManager->value, UserRole::Admin->value],
                'condition_type' => 'checklist_closed',
                'condition_value' => null,
            ],
            [
                'from_status' => HypothesisStatus::Experiment->value,
                'to_status' => HypothesisStatus::GoNoGo->value,
                'allowed_roles' => [UserRole::PdManager->value, UserRole::Admin->value],
                'condition_type' => 'none',
                'condition_value' => null,
            ],
            [
                'from_status' => HypothesisStatus::GoNoGo->value,
                'to_status' => HypothesisStatus::Done->value,
                'allowed_roles' => [UserRole::Admin->value],
                'condition_type' => 'none',
                'condition_value' => null,
            ],
            [
                'from_status' => HypothesisStatus::GoNoGo->value,
                'to_status' => HypothesisStatus::Archived->value,
                'allowed_roles' => [UserRole::Admin->value],
                'condition_type' => 'none',
                'condition_value' => null,
            ],
            [
                'from_status' => HypothesisStatus::Experiment->value,
                'to_status' => HypothesisStatus::DeepDive->value,
                'allowed_roles' => [UserRole::PdManager->value, UserRole::Admin->value],
                'condition_type' => 'none',
                'condition_value' => null,
            ],
            [
                'from_status' => HypothesisStatus::Done->value,
                'to_status' => HypothesisStatus::Archived->value,
                'allowed_roles' => [UserRole::Admin->value],
                'condition_type' => 'none',
                'condition_value' => null,
            ],
        ];

        foreach ($transitions as $transition) {
            StatusTransition::query()->updateOrCreate(
                [
                    'from_status' => $transition['from_status'],
                    'to_status' => $transition['to_status'],
                ],
                [
                    'allowed_roles' => $transition['allowed_roles'],
                    'condition_type' => $transition['condition_type'],
                    'condition_value' => $transition['condition_value'],
                    'is_active' => true,
                ],
            );
        }
    }
}
