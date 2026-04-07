<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Hypothesis;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
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
            'hypothesis_id' => fake()->boolean(80) ? Hypothesis::factory() : null,
            'type' => fake()->randomElement(['info', 'success', 'warning', 'error']),
            'message' => fake()->sentence(),
            'is_read' => fake()->boolean(30),
        ];
    }
}
