<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CommitteeMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommitteeMember>
 */
class CommitteeMemberFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'display_role' => fake()->optional()->randomElement(['chair', 'expert', 'observer']),
            'order' => fake()->numberBetween(0, 10),
            'is_active' => fake()->boolean(90),
        ];
    }
}
