<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Enums\HypothesisStatus;
use App\Enums\Priority;
use App\Models\Hypothesis;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HypothesisTest extends TestCase
{
    use RefreshDatabase;

    public function test_hypothesis_has_correct_casts(): void
    {
        $hypothesis = new Hypothesis();

        $this->assertArrayHasKey('status', $hypothesis->getCasts());
        $this->assertArrayHasKey('priority', $hypothesis->getCasts());
    }

    public function test_hypothesis_belongs_to_initiator(): void
    {
        $user = User::factory()->create();
        $team = Team::factory()->create();

        $hypothesis = Hypothesis::factory()->create([
            'initiator_id' => $user->id,
            'team_id' => $team->id,
            'status' => HypothesisStatus::Backlog,
            'priority' => Priority::Medium,
        ]);

        $this->assertSame($user->id, $hypothesis->initiator->id);
    }
}
