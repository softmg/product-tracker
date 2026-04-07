<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\NotificationEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NotificationEvent>
 */
class NotificationEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_type' => fake()->unique()->randomElement([
                'hypothesis.created',
                'hypothesis.assigned',
                'experiment.completed',
                'committee.vote.submitted',
            ]),
            'is_active' => fake()->boolean(90),
            'recipients' => fake()->randomElements(['owner', 'initiator', 'committee'], fake()->numberBetween(1, 3)),
            'template' => fake()->optional()->sentence(),
            'channel' => fake()->randomElement(['in_app', 'email']),
        ];
    }
}
