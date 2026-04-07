<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CommitteeMember;
use App\Models\CommitteeVote;
use App\Models\Hypothesis;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommitteeVote>
 */
class CommitteeVoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $vote = fake()->randomElement(['go', 'no_go', 'iterate']);

        return [
            'hypothesis_id' => Hypothesis::factory(),
            'member_id' => CommitteeMember::factory(),
            'vote' => $vote,
            'comment' => fake()->optional()->sentence(),
            'voted_at' => $vote ? now() : null,
        ];
    }
}
