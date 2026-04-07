<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DeepDiveStage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeepDiveStage>
 */
class DeepDiveStageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'order' => fake()->numberBetween(0, 10),
            'is_required' => fake()->boolean(85),
            'responsible_role' => fake()->randomElement(['pd_manager', 'analyst', 'researcher']),
            'is_active' => fake()->boolean(90),
        ];
    }
}
