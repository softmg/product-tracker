<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ScoringCriterion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScoringCriterion>
 */
class ScoringCriterionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $minValue = fake()->numberBetween(1, 3);
        $maxValue = fake()->numberBetween($minValue + 2, $minValue + 6);

        return [
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'input_type' => fake()->randomElement(['slider', 'numeric']),
            'min_value' => $minValue,
            'max_value' => $maxValue,
            'weight' => fake()->randomFloat(2, 0.50, 3.00),
            'is_active' => fake()->boolean(90),
            'thresholds' => [
                'warning' => $minValue + 1,
                'target' => $maxValue - 1,
            ],
            'is_stop_factor' => fake()->boolean(20),
            'stage' => fake()->randomElement(['primary', 'deep']),
            'order' => fake()->numberBetween(0, 20),
        ];
    }
}
