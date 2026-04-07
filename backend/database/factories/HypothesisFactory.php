<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\HypothesisStatus;
use App\Enums\Priority;
use App\Models\Hypothesis;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hypothesis>
 */
class HypothesisFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => sprintf('HYP-%03d', fake()->unique()->numberBetween(1, 999)),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'problem' => fake()->paragraph(),
            'solution' => fake()->paragraph(),
            'assumptions' => fake()->paragraph(),
            'target_audience' => fake()->sentence(6),
            'status' => HypothesisStatus::Backlog,
            'priority' => Priority::Medium,
            'initiator_id' => User::factory(),
            'owner_id' => User::factory(),
            'team_id' => Team::factory(),
            'scoring_primary' => null,
            'scoring_deep' => null,
            'sla_deadline' => null,
            'sla_status' => null,
        ];
    }
}
