<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DeepDiveStage;
use App\Models\Hypothesis;
use App\Models\HypothesisDeepDive;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HypothesisDeepDive>
 */
class HypothesisDeepDiveFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCompleted = fake()->boolean(40);

        return [
            'hypothesis_id' => Hypothesis::factory(),
            'stage_id' => DeepDiveStage::factory(),
            'is_completed' => $isCompleted,
            'completed_by' => $isCompleted ? User::factory() : null,
            'comments' => $isCompleted
                ? [['author' => fake()->name(), 'text' => fake()->sentence()]]
                : [],
            'completed_at' => $isCompleted ? now() : null,
        ];
    }
}
