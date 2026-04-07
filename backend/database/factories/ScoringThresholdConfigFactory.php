<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ScoringThresholdConfig;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScoringThresholdConfig>
 */
class ScoringThresholdConfigFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'primary_threshold' => fake()->randomFloat(2, 5.00, 9.50),
            'deep_threshold' => fake()->randomFloat(2, 5.00, 9.50),
        ];
    }
}
