<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\HypothesisStatus;
use App\Models\Hypothesis;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_distribution_returns_correct_counts(): void
    {
        $user = User::factory()->create();

        Hypothesis::factory()->count(3)->create([
            'status' => HypothesisStatus::Backlog,
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
            'team_id' => $user->team_id,
        ]);

        Hypothesis::factory()->count(2)->create([
            'status' => HypothesisStatus::Scoring,
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
            'team_id' => $user->team_id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/analytics/status-distribution');

        $response->assertOk();

        $data = collect($response->json('data'));

        $this->assertSame(3, $data->firstWhere('status', HypothesisStatus::Backlog->value)['count']);
        $this->assertSame(2, $data->firstWhere('status', HypothesisStatus::Scoring->value)['count']);
    }

    public function test_initiator_and_team_stats_return_aggregates(): void
    {
        $user = User::factory()->create(['name' => 'Alice']);
        $secondUser = User::factory()->create(['name' => 'Bob']);

        $teamA = Team::factory()->create(['name' => 'Team A']);
        $teamB = Team::factory()->create(['name' => 'Team B']);

        Hypothesis::factory()->count(2)->create([
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
            'team_id' => $teamA->id,
        ]);

        Hypothesis::factory()->count(3)->create([
            'initiator_id' => $secondUser->id,
            'owner_id' => $secondUser->id,
            'team_id' => $teamB->id,
        ]);

        $initiatorResponse = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/analytics/initiator-stats');

        $initiatorResponse->assertOk();

        $initiatorData = collect($initiatorResponse->json('data'));
        $this->assertSame(2, $initiatorData->firstWhere('user_id', $user->id)['count']);
        $this->assertSame(3, $initiatorData->firstWhere('user_id', $secondUser->id)['count']);

        $teamResponse = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/analytics/team-stats');

        $teamResponse->assertOk();

        $teamData = collect($teamResponse->json('data'));
        $this->assertSame(2, $teamData->firstWhere('team_id', $teamA->id)['count']);
        $this->assertSame(3, $teamData->firstWhere('team_id', $teamB->id)['count']);
    }

    public function test_timeline_supports_date_range_filtering(): void
    {
        $user = User::factory()->create();

        Hypothesis::factory()->create([
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
            'team_id' => $user->team_id,
            'created_at' => '2026-01-10 10:00:00',
        ]);

        Hypothesis::factory()->create([
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
            'team_id' => $user->team_id,
            'created_at' => '2026-02-15 10:00:00',
        ]);

        Hypothesis::factory()->create([
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
            'team_id' => $user->team_id,
            'created_at' => '2026-03-20 10:00:00',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/analytics/timeline?from=2026-02-01&to=2026-03-31');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.month', '2026-02')
            ->assertJsonPath('data.0.count', 1)
            ->assertJsonPath('data.1.month', '2026-03')
            ->assertJsonPath('data.1.count', 1);
    }

    public function test_user_can_export_analytics_excel(): void
    {
        $user = User::factory()->create();

        Hypothesis::factory()->create([
            'initiator_id' => $user->id,
            'owner_id' => $user->id,
            'team_id' => $user->team_id,
            'status' => HypothesisStatus::Scoring,
            'scoring_primary' => 8.5,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->get('/api/v1/analytics/export');

        $response
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_unauthenticated_user_cannot_access_analytics_endpoints(): void
    {
        $this->getJson('/api/v1/analytics/status-distribution')->assertUnauthorized();
        $this->getJson('/api/v1/analytics/initiator-stats')->assertUnauthorized();
        $this->getJson('/api/v1/analytics/team-stats')->assertUnauthorized();
        $this->getJson('/api/v1/analytics/timeline')->assertUnauthorized();
        $this->getJson('/api/v1/analytics/export')->assertUnauthorized();
    }
}
