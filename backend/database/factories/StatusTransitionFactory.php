<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\StatusTransition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StatusTransition>
 */
class StatusTransitionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fromStatus = fake()->randomElement(HypothesisStatus::cases())->value;
        $toStatus = fake()->randomElement(HypothesisStatus::cases())->value;

        if ($toStatus === $fromStatus) {
            $toStatus = HypothesisStatus::Scoring->value;
        }

        return [
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'allowed_roles' => [fake()->randomElement(UserRole::cases())->value],
            'condition_type' => fake()->randomElement(['none', 'required_fields', 'scoring_threshold', 'checklist_closed']),
            'condition_value' => null,
            'is_active' => true,
        ];
    }
}
