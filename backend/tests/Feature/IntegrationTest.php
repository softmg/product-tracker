<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Events\SlaViolation;
use App\Models\Hypothesis;
use App\Models\NotificationEvent;
use App\Models\SlaConfig;
use App\Models\StatusTransition;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_hypothesis_and_listing_it(): void
    {
        $team = Team::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
            'team_id' => $team->id,
        ]);

        $createResponse = $this->actingAs($user, 'web')
            ->postJson('/api/v1/hypotheses', [
                'title' => 'Integration Test Hypothesis',
                'description' => 'Testing integration flow',
            ]);

        $createResponse->assertCreated();
        $hypothesisId = $createResponse->json('data.id');

        $listResponse = $this->actingAs($user, 'web')
            ->getJson('/api/v1/hypotheses');

        $listResponse->assertOk();
        $ids = collect($listResponse->json('data'))->pluck('id')->toArray();
        $this->assertContains($hypothesisId, $ids);
    }

    public function test_hypothesis_detail_includes_all_required_fields(): void
    {
        $hypothesis = Hypothesis::factory()->create();
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $response = $this->actingAs($admin, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id', 'code', 'title', 'status',
                    'created_at', 'updated_at',
                ],
            ]);
    }

    public function test_multiple_transitions_create_audit_trail(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $hypothesis = Hypothesis::factory()->create(['status' => HypothesisStatus::Backlog]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Scoring->value,
            'to_status' => HypothesisStatus::DeepDive->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $this->actingAs($admin, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
            ]);

        $this->actingAs($admin, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::DeepDive->value,
            ]);

        $auditResponse = $this->actingAs($admin, 'web')
            ->getJson("/api/v1/audit-log?entity_id={$hypothesis->id}");

        $auditResponse->assertOk();
        $this->assertGreaterThanOrEqual(2, count($auditResponse->json('data')));
    }

    public function test_notification_event_triggers_on_sla_violation(): void
    {
        Event::fake([SlaViolation::class]);

        $owner = User::factory()->create(['role' => UserRole::PdManager]);
        $initiator = User::factory()->create(['role' => UserRole::Initiator]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Scoring,
            'owner_id' => $owner->id,
            'initiator_id' => $initiator->id,
        ]);

        Event::dispatch(new SlaViolation($hypothesis));

        Event::assertDispatched(SlaViolation::class);
    }

    public function test_analytics_endpoints_are_accessible_to_authenticated_users(): void
    {
        $user = User::factory()->create(['role' => UserRole::PdManager]);

        Hypothesis::factory()->count(5)->create();

        $endpoints = [
            '/api/v1/analytics/status-distribution',
            '/api/v1/analytics/initiator-stats',
            '/api/v1/analytics/team-stats',
            '/api/v1/analytics/timeline',
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->actingAs($user, 'web')->getJson($endpoint);
            $response->assertOk();
        }
    }

    public function test_pagination_works_on_hypothesis_list(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        Hypothesis::factory()->count(20)->create();

        $response = $this->actingAs($user, 'web')
            ->getJson('/api/v1/hypotheses?per_page=5&page=1');

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.current_page', 1);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_search_filter_returns_matching_hypotheses(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        Hypothesis::factory()->create(['title' => 'Unique search term hypothesis']);
        Hypothesis::factory()->count(5)->create();

        $response = $this->actingAs($user, 'web')
            ->getJson('/api/v1/hypotheses?search=Unique+search+term');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title')->toArray();
        $this->assertTrue(
            collect($titles)->contains(fn ($t) => str_contains($t, 'Unique search term')),
        );
    }
}
