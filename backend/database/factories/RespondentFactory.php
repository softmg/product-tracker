<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Hypothesis;
use App\Models\Respondent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Respondent>
 */
class RespondentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['new', 'contacted', 'interviewed']);
        $interviewDate = $status === 'interviewed' ? fake()->dateTimeBetween('-2 months', 'now') : null;

        return [
            'hypothesis_id' => Hypothesis::factory(),
            'name' => fake()->name(),
            'company' => fake()->optional()->company(),
            'position' => fake()->optional()->jobTitle(),
            'email' => fake()->optional()->safeEmail(),
            'phone' => fake()->optional()->phoneNumber(),
            'contact_source' => fake()->optional()->randomElement(['linkedin', 'referral', 'crm']),
            'status' => $status,
            'interview_date' => $interviewDate,
            'interview_duration' => $interviewDate ? fake()->numberBetween(20, 90) : null,
            'interviewer_user_id' => $interviewDate ? User::factory() : null,
            'interview_format' => $interviewDate ? fake()->randomElement(['online', 'offline']) : null,
            'recording_url' => $interviewDate ? fake()->optional()->url() : null,
        ];
    }
}
