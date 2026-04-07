<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Experiment;
use App\Models\ExperimentMetric;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExperimentMetric>
 */
class ExperimentMetricFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $target = fake()->randomFloat(2, 1, 1000);
        $actual = fake()->randomFloat(2, 1, 1000);

        return [
            'experiment_id' => Experiment::factory(),
            'name' => fake()->randomElement(['ctr', 'conversion_rate', 'cpl', 'retention']),
            'target_value' => $target,
            'actual_value' => $actual,
            'unit' => fake()->randomElement(['%', 'users', 'rub']),
            'result' => $actual >= $target ? 'met' : 'not_met',
        ];
    }
}
