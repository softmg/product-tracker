<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Hypothesis;
use App\Models\HypothesisScoring;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HypothesisScoring>
 */
class HypothesisScoringFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $scoreA = fake()->numberBetween(1, 10);
        $scoreB = fake()->numberBetween(1, 10);
        $scoreC = fake()->numberBetween(1, 10);

        return [
            'hypothesis_id' => Hypothesis::factory(),
            'stage' => fake()->randomElement(['primary', 'deep']),
            'criteria_scores' => [
                ['criterion' => 'value', 'score' => $scoreA],
                ['criterion' => 'feasibility', 'score' => $scoreB],
                ['criterion' => 'impact', 'score' => $scoreC],
            ],
            'total_score' => round(($scoreA + $scoreB + $scoreC) / 3, 2),
            'stop_factor_triggered' => fake()->boolean(15),
            'scored_by' => User::factory(),
        ];
    }
}
