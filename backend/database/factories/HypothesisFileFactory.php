<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Hypothesis;
use App\Models\HypothesisFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HypothesisFile>
 */
class HypothesisFileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hypothesis_id' => Hypothesis::factory(),
            'stage' => fake()->optional()->randomElement(['primary', 'deep']),
            'name' => fake()->words(2, true).'.pdf',
            'path' => 'uploads/hypotheses/'.fake()->uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'size' => fake()->numberBetween(10_000, 5_000_000),
            'uploaded_by' => User::factory(),
        ];
    }
}
