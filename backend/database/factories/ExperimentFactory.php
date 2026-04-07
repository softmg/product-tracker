<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Experiment;
use App\Models\Hypothesis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Experiment>
 */
class ExperimentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['planned', 'running', 'completed']);
        $startDate = fake()->dateTimeBetween('-30 days', 'now');
        $endDate = $status === 'completed' ? fake()->dateTimeBetween($startDate, 'now') : null;

        return [
            'hypothesis_id' => Hypothesis::factory(),
            'title' => fake()->sentence(4),
            'type' => fake()->randomElement(['interview', 'landing_page', 'ads', 'prototype']),
            'status' => $status,
            'description' => fake()->optional()->paragraph(),
            'what_worked' => $status === 'completed' ? fake()->optional()->sentence() : null,
            'what_not_worked' => $status === 'completed' ? fake()->optional()->sentence() : null,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'result' => $status === 'completed'
                ? fake()->randomElement(['validated', 'partially_validated', 'invalidated'])
                : null,
            'notes' => fake()->optional()->paragraph(),
            'created_by' => User::factory(),
            'responsible_user_id' => User::factory(),
        ];
    }
}
