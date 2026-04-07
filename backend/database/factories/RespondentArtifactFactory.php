<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Respondent;
use App\Models\RespondentArtifact;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RespondentArtifact>
 */
class RespondentArtifactFactory extends Factory
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
            'name' => fake()->words(2, true).'.mp4',
            'path' => 'uploads/respondents/'.fake()->uuid().'.mp4',
            'mime_type' => 'video/mp4',
            'size' => fake()->numberBetween(50_000, 20_000_000),
        ];
    }
}
