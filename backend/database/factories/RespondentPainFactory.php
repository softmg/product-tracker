<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Respondent;
use App\Models\RespondentPain;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RespondentPain>
 */
class RespondentPainFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'respondent_id' => Respondent::factory(),
            'tag' => fake()->randomElement(['cost', 'speed', 'quality', 'integration']),
            'quote' => fake()->optional()->sentence(),
        ];
    }
}
