<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'entity_type' => fake()->randomElement(AuditLog::ENTITY_TYPES),
            'entity_id' => 1,
            'action' => fake()->randomElement(AuditLog::ACTIONS),
            'changes' => [
                'before' => ['status' => 'backlog'],
                'after' => ['status' => 'in_review'],
            ],
            'user_id' => User::factory(),
        ];
    }
}
