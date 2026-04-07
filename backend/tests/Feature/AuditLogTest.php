<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Experiment;
use App\Models\Hypothesis;
use App\Models\StatusTransition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_hypothesis_creation_logged(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/v1/hypotheses', [
                'title' => 'Test hypothesis for audit',
                'description' => 'Test',
                'problem' => 'Problem',
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $response->json('data.id'),
            'action' => AuditLog::ACTION_CREATE,
            'user_id' => $user->id,
        ]);

        $this->assertContains(AuditLog::ENTITY_TYPE_HYPOTHESIS, AuditLog::ENTITY_TYPES);
        $this->assertContains(AuditLog::ACTION_CREATE, AuditLog::ACTIONS);
        $this->assertContains(AuditLog::ACTION_UPDATE, AuditLog::ACTIONS);
        $this->assertContains(AuditLog::ACTION_DELETE, AuditLog::ACTIONS);
        $this->assertContains(AuditLog::ACTION_STATUS_CHANGE, AuditLog::ACTIONS);
    }

    public function test_hypothesis_create_log_contains_after_without_updated_at(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/v1/hypotheses', [
                'title' => 'Hypothesis created payload',
            ]);

        $response->assertCreated();
        $hypothesisId = (int) $response->json('data.id');

        $log = AuditLog::query()
            ->where('entity_type', AuditLog::ENTITY_TYPE_HYPOTHESIS)
            ->where('entity_id', $hypothesisId)
            ->where('action', AuditLog::ACTION_CREATE)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);

        $after = $log->changes['after'] ?? [];

        $this->assertSame($hypothesisId, (int) data_get($after, 'id'));
        $this->assertSame('Hypothesis created payload', data_get($after, 'title'));
        $this->assertArrayNotHasKey('updated_at', $after);
    }

    public function test_status_change_logged(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
                'comment' => 'Move for scoring',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_STATUS_CHANGE,
            'user_id' => $user->id,
        ]);
    }

    public function test_hypothesis_update_log_contains_before_and_after_without_updated_at(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $createResponse = $this
            ->actingAs($user, 'web')
            ->postJson('/api/v1/hypotheses', [
                'title' => 'Initial hypothesis title',
            ]);

        $createResponse->assertCreated();
        $hypothesisId = (int) $createResponse->json('data.id');

        $this
            ->actingAs($user, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesisId}", [
                'title' => 'Updated hypothesis title',
            ])
            ->assertOk();

        $log = AuditLog::query()
            ->where('entity_type', AuditLog::ENTITY_TYPE_HYPOTHESIS)
            ->where('entity_id', $hypothesisId)
            ->where('action', AuditLog::ACTION_UPDATE)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);

        $before = $log->changes['before'] ?? [];
        $after = $log->changes['after'] ?? [];

        $this->assertSame('Initial hypothesis title', data_get($before, 'title'));
        $this->assertSame('Updated hypothesis title', data_get($after, 'title'));
        $this->assertArrayNotHasKey('updated_at', $before);
        $this->assertArrayNotHasKey('updated_at', $after);
    }

    public function test_hypothesis_delete_log_contains_before_without_updated_at(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'title' => 'Hypothesis to delete',
        ]);

        $this
            ->actingAs($admin, 'web')
            ->deleteJson("/api/v1/hypotheses/{$hypothesis->id}")
            ->assertNoContent();

        $log = AuditLog::query()
            ->where('entity_type', AuditLog::ENTITY_TYPE_HYPOTHESIS)
            ->where('entity_id', $hypothesis->id)
            ->where('action', AuditLog::ACTION_DELETE)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);

        $before = $log->changes['before'] ?? [];

        $this->assertSame($hypothesis->id, (int) data_get($before, 'id'));
        $this->assertSame('Hypothesis to delete', data_get($before, 'title'));
        $this->assertArrayNotHasKey('updated_at', $before);
    }

    public function test_audit_log_filterable_by_entity_type(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        AuditLog::factory()->count(3)->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::factory()->count(2)->create([
            'entity_type' => AuditLog::ENTITY_TYPE_EXPERIMENT,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_type='.AuditLog::ENTITY_TYPE_HYPOTHESIS);

        $response
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_audit_log_index_filters_by_entity_id(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => 101,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => 202,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_id=101');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertSame(101, (int) data_get($response->json('data'), '0.entity_id'));
    }

    public function test_audit_log_index_filters_by_user_id(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $targetUser = User::factory()->create();
        $otherUser = User::factory()->create();

        AuditLog::factory()->count(2)->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $targetUser->id,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $otherUser->id,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson("/api/v1/audit-log?user_id={$targetUser->id}");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');

        foreach ($response->json('data') as $item) {
            $this->assertSame($targetUser->id, (int) data_get($item, 'user_id'));
        }
    }

    public function test_audit_log_index_filters_by_date_range(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $inRangeStart = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $inRangeEnd = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $outOfRangeBefore = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $outOfRangeAfter = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::query()->whereKey($outOfRangeBefore->id)->update([
            'created_at' => '2026-01-09 08:00:00',
        ]);

        AuditLog::query()->whereKey($inRangeStart->id)->update([
            'created_at' => '2026-01-10 09:00:00',
        ]);

        AuditLog::query()->whereKey($inRangeEnd->id)->update([
            'created_at' => '2026-01-20 17:00:00',
        ]);

        AuditLog::query()->whereKey($outOfRangeAfter->id)->update([
            'created_at' => '2026-01-21 10:00:00',
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?date_from=2026-01-10&date_to=2026-01-20');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $actualIds = collect($response->json('data'))
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->sort()
            ->values()
            ->all();

        $expectedIds = collect([$inRangeStart->id, $inRangeEnd->id])
            ->sort()
            ->values()
            ->all();

        $this->assertSame($expectedIds, $actualIds);
    }

    public function test_audit_log_index_filters_by_date_to_only(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $older = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $newer = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::query()->whereKey($older->id)->update([
            'created_at' => '2026-01-10 10:00:00',
        ]);

        AuditLog::query()->whereKey($newer->id)->update([
            'created_at' => '2026-01-11 10:00:00',
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?date_to=2026-01-10');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertSame($older->id, (int) data_get($response->json('data'), '0.id'));
    }

    public function test_audit_log_index_date_range_filters_use_created_at_datetime_bounds(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $inRangeLateNight = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $outOfRangeStartBoundary = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $outOfRangeAfterEnd = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::query()->whereKey($outOfRangeStartBoundary->id)->update([
            'created_at' => '2026-01-09 23:59:59',
        ]);

        AuditLog::query()->whereKey($inRangeLateNight->id)->update([
            'created_at' => '2026-01-10 23:59:59',
        ]);

        AuditLog::query()->whereKey($outOfRangeAfterEnd->id)->update([
            'created_at' => '2026-01-11 00:00:00',
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?date_from=2026-01-10&date_to=2026-01-10');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $inRangeLateNight->id);
    }

    public function test_audit_log_index_date_from_is_inclusive_from_start_of_day(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $beforeBoundary = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $atBoundary = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::query()->whereKey($beforeBoundary->id)->update([
            'created_at' => '2026-01-10 00:00:00',
        ]);

        AuditLog::query()->whereKey($atBoundary->id)->update([
            'created_at' => '2026-01-10 00:00:01',
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?date_from=2026-01-10');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $ids = collect($response->json('data'))
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        $this->assertContains($beforeBoundary->id, $ids);
        $this->assertContains($atBoundary->id, $ids);
    }

    public function test_audit_log_index_date_to_is_inclusive_to_end_of_day(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $atEndOfDay = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $afterEndOfDay = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::query()->whereKey($atEndOfDay->id)->update([
            'created_at' => '2026-01-10 23:59:59',
        ]);

        AuditLog::query()->whereKey($afterEndOfDay->id)->update([
            'created_at' => '2026-01-11 00:00:00',
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?date_to=2026-01-10');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $atEndOfDay->id);
    }

    public function test_audit_log_index_filters_by_valid_team_entity_type(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_TEAM,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_type='.AuditLog::ENTITY_TYPE_TEAM);

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertSame(AuditLog::ENTITY_TYPE_TEAM, data_get($response->json('data'), '0.entity_type'));
    }

    public function test_audit_log_index_respects_per_page_and_desc_order(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $first = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $second = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $third = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?per_page=2');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);

        $this->assertSame($third->id, (int) data_get($response->json('data'), '0.id'));
        $this->assertSame($second->id, (int) data_get($response->json('data'), '1.id'));
        $this->assertNotSame($first->id, (int) data_get($response->json('data'), '0.id'));
    }

    public function test_audit_log_index_paginates_with_deterministic_newest_first_slices(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $oldest = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_TEAM,
            'entity_id' => 7001,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $second = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_TEAM,
            'entity_id' => 7002,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $third = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_TEAM,
            'entity_id' => 7003,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $newest = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_TEAM,
            'entity_id' => 7004,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $pageOne = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_type='.AuditLog::ENTITY_TYPE_TEAM.'&per_page=2&page=1');

        $pageOne
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 4);

        $pageTwo = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_type='.AuditLog::ENTITY_TYPE_TEAM.'&per_page=2&page=2');

        $pageTwo
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 4);

        $pageOneIds = [
            (int) data_get($pageOne->json('data'), '0.id'),
            (int) data_get($pageOne->json('data'), '1.id'),
        ];

        $pageTwoIds = [
            (int) data_get($pageTwo->json('data'), '0.id'),
            (int) data_get($pageTwo->json('data'), '1.id'),
        ];

        $this->assertSame([$newest->id, $third->id], $pageOneIds);
        $this->assertSame([$second->id, $oldest->id], $pageTwoIds);
    }

    public function test_audit_log_access_restricted_to_admin(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/audit-log');

        $response->assertForbidden();
    }

    public function test_audit_log_resource_exposes_only_user_id_and_name(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'email' => 'admin@example.com',
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => 444,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $admin->id,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_id=444');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.user.id', $admin->id)
            ->assertJsonPath('data.0.user.name', $admin->name);

        $this->assertNull(data_get($response->json('data'), '0.user.email'));
        $this->assertNull(data_get($response->json('data'), '0.user.role'));
        $this->assertNull(data_get($response->json('data'), '0.user.is_active'));
    }

    public function test_audit_log_index_returns_null_user_payload_when_actor_deleted(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $actor = User::factory()->create();

        $log = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => 445,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $actor->id,
        ]);

        $actor->delete();

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_id=445');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $log->id)
            ->assertJsonPath('data.0.user_id', null)
            ->assertJsonPath('data.0.user', null);
    }

    public function test_non_admin_cannot_access_audit_log_index_even_with_valid_filters(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/audit-log?entity_type='.AuditLog::ENTITY_TYPE_HYPOTHESIS.'&action='.AuditLog::ACTION_UPDATE)
            ->assertForbidden();
    }

    public function test_non_admin_cannot_access_audit_log_index_without_auth_middleware_alias(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/audit-log')
            ->assertForbidden();
    }

    public function test_non_admin_gets_forbidden_before_filter_validation(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/audit-log?action=invalid_action')
            ->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_audit_log_index(): void
    {
        $this->getJson('/api/v1/audit-log')->assertUnauthorized();
    }

    public function test_unauthenticated_user_gets_unauthorized_before_filter_validation(): void
    {
        $this
            ->getJson('/api/v1/audit-log?action=invalid_action')
            ->assertUnauthorized();
    }

    public function test_audit_log_index_returns_422_for_invalid_filters_when_admin(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?action=invalid_action')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['action']);
    }

    public function test_unauthenticated_user_cannot_access_hypothesis_history_endpoint(): void
    {
        $hypothesis = Hypothesis::factory()->create();

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/history")->assertUnauthorized();
    }

    public function test_hypothesis_history_endpoint_includes_sanitized_user_payload(): void
    {
        $actor = User::factory()->create([
            'email' => 'actor@example.com',
        ]);

        $hypothesis = Hypothesis::factory()->create();

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $actor->id,
        ]);

        $response = $this
            ->actingAs($actor, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history");

        $response
            ->assertOk()
            ->assertJsonPath('data.0.user.id', $actor->id)
            ->assertJsonPath('data.0.user.name', $actor->name);

        $this->assertNull(data_get($response->json('data'), '0.user.email'));
    }

    public function test_hypothesis_history_endpoint_returns_null_user_payload_when_actor_deleted(): void
    {
        $actor = User::factory()->create();
        $viewer = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $log = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $actor->id,
        ]);

        $actor->delete();

        $response = $this
            ->actingAs($viewer, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history");

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $log->id)
            ->assertJsonPath('data.0.user_id', null)
            ->assertJsonPath('data.0.user', null);
    }

    public function test_hypothesis_history_endpoint_returns_entries_for_hypothesis(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_STATUS_CHANGE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id + 1000,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history");

        $response
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_hypothesis_history_endpoint_returns_newest_first_and_only_hypothesis_entity(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        AuditLog::query()->delete();

        $oldest = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $middle = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_STATUS_CHANGE,
        ]);

        $newest = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_DELETE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_EXPERIMENT,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id + 1,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history");

        $response
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $ids = collect($response->json('data'))
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        $this->assertSame([$newest->id, $middle->id, $oldest->id], $ids);

        foreach ($response->json('data') as $item) {
            $this->assertSame(AuditLog::ENTITY_TYPE_HYPOTHESIS, data_get($item, 'entity_type'));
            $this->assertSame($hypothesis->id, (int) data_get($item, 'entity_id'));
        }
    }

    public function test_hypothesis_history_endpoint_paginates_with_per_page_limit(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        AuditLog::query()->delete();

        $oldest = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $middle = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_STATUS_CHANGE,
        ]);

        $newest = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_DELETE,
        ]);

        $pageOne = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history?per_page=2&page=1");

        $pageOne
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);

        $pageTwo = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history?per_page=2&page=2");

        $pageTwo
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);

        $this->assertSame($newest->id, (int) data_get($pageOne->json('data'), '0.id'));
        $this->assertSame($middle->id, (int) data_get($pageOne->json('data'), '1.id'));
        $this->assertSame($oldest->id, (int) data_get($pageTwo->json('data'), '0.id'));
    }

    public function test_hypothesis_history_endpoint_validates_per_page_limits(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history?per_page=0")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);

        $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history?per_page=101")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_hypothesis_history_endpoint_redacts_sensitive_keys_in_changes_payload(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => $hypothesis->id,
            'action' => AuditLog::ACTION_UPDATE,
            'changes' => [
                'before' => [
                    'password' => 'old-secret',
                    'api_key' => 'key-before',
                ],
                'after' => [
                    'access_token' => 'token-value',
                    'notes' => 'safe-value',
                    'nested' => [
                        'remember_token' => 'remember-me',
                    ],
                ],
            ],
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/history");

        $response
            ->assertOk()
            ->assertJsonPath('data.0.changes.before.password', '[REDACTED]')
            ->assertJsonPath('data.0.changes.before.api_key', '[REDACTED]')
            ->assertJsonPath('data.0.changes.after.access_token', '[REDACTED]')
            ->assertJsonPath('data.0.changes.after.notes', 'safe-value')
            ->assertJsonPath('data.0.changes.after.nested.remember_token', '[REDACTED]');
    }

    public function test_audit_log_index_redacts_sensitive_keys_in_changes_payload(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => 9821,
            'action' => AuditLog::ACTION_UPDATE,
            'changes' => [
                'before' => [
                    'password' => 'old-secret',
                    'api_key' => 'key-before',
                ],
                'after' => [
                    'access_token' => 'token-value',
                    'notes' => 'safe-value',
                    'nested' => [
                        'remember_token' => 'remember-me',
                    ],
                ],
            ],
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_id=9821');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.changes.before.password', '[REDACTED]')
            ->assertJsonPath('data.0.changes.before.api_key', '[REDACTED]')
            ->assertJsonPath('data.0.changes.after.access_token', '[REDACTED]')
            ->assertJsonPath('data.0.changes.after.notes', 'safe-value')
            ->assertJsonPath('data.0.changes.after.nested.remember_token', '[REDACTED]');
    }

    public function test_status_change_log_contains_from_to_payload(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::Backlog,
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::Backlog->value,
            'to_status' => HypothesisStatus::Scoring->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/transition", [
                'to_status' => HypothesisStatus::Scoring->value,
            ])
            ->assertOk();

        $log = AuditLog::query()
            ->where('entity_type', AuditLog::ENTITY_TYPE_HYPOTHESIS)
            ->where('entity_id', $hypothesis->id)
            ->where('action', AuditLog::ACTION_STATUS_CHANGE)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame(HypothesisStatus::Backlog->value, $log->changes['from_status'] ?? null);
        $this->assertSame(HypothesisStatus::Scoring->value, $log->changes['to_status'] ?? null);
    }

    public function test_audit_log_index_validates_filters_and_pagination_limits(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?action=invalid_action')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['action']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?date_from=2026-01-10&date_to=2026-01-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_to']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?per_page=999')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_type=invalid_entity')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['entity_type']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_id=0')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['entity_id']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_id=not-a-number')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['entity_id']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?user_id=not-a-number')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?user_id=0')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?date_from=not-a-date')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_from']);

        $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?per_page=0')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_audit_log_index_filters_by_action_status_change(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        AuditLog::factory()->create([
            'action' => AuditLog::ACTION_STATUS_CHANGE,
        ]);

        AuditLog::factory()->create([
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?action='.AuditLog::ACTION_STATUS_CHANGE);

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertSame(AuditLog::ACTION_STATUS_CHANGE, data_get($response->json('data'), '0.action'));
    }

    public function test_audit_log_index_applies_combined_entity_type_and_entity_id_filters(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => 501,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'entity_id' => 999,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_EXPERIMENT,
            'entity_id' => 501,
            'action' => AuditLog::ACTION_UPDATE,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/audit-log?entity_type='.AuditLog::ENTITY_TYPE_HYPOTHESIS.'&entity_id=501');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertSame(AuditLog::ENTITY_TYPE_HYPOTHESIS, data_get($response->json('data'), '0.entity_type'));
        $this->assertSame(501, (int) data_get($response->json('data'), '0.entity_id'));
    }

    public function test_audit_log_index_applies_entity_type_action_and_user_id_as_intersection(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $targetUser = User::factory()->create();
        $otherUser = User::factory()->create();

        $match = AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_STATUS_CHANGE,
            'user_id' => $targetUser->id,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $targetUser->id,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_EXPERIMENT,
            'action' => AuditLog::ACTION_STATUS_CHANGE,
            'user_id' => $targetUser->id,
        ]);

        AuditLog::factory()->create([
            'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
            'action' => AuditLog::ACTION_STATUS_CHANGE,
            'user_id' => $otherUser->id,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson(
                '/api/v1/audit-log?entity_type='.AuditLog::ENTITY_TYPE_HYPOTHESIS
                .'&action='.AuditLog::ACTION_STATUS_CHANGE
                ."&user_id={$targetUser->id}",
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $item = data_get($response->json('data'), '0');

        $this->assertSame($match->id, (int) data_get($item, 'id'));
        $this->assertSame(AuditLog::ENTITY_TYPE_HYPOTHESIS, data_get($item, 'entity_type'));
        $this->assertSame(AuditLog::ACTION_STATUS_CHANGE, data_get($item, 'action'));
        $this->assertSame($targetUser->id, (int) data_get($item, 'user_id'));
    }

    public function test_experiment_changes_are_logged(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $createResponse = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
                'title' => 'Experiment for audit',
                'type' => 'interview',
            ]);

        $createResponse->assertCreated();
        $experimentId = (int) $createResponse->json('data.id');

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => AuditLog::ENTITY_TYPE_EXPERIMENT,
            'entity_id' => $experimentId,
            'action' => AuditLog::ACTION_CREATE,
            'user_id' => $user->id,
        ]);

        $this
            ->actingAs($user, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experimentId}", [
                'title' => 'Experiment for audit updated',
            ])
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => AuditLog::ENTITY_TYPE_EXPERIMENT,
            'entity_id' => $experimentId,
            'action' => AuditLog::ACTION_UPDATE,
            'user_id' => $user->id,
        ]);

        $experiment = Experiment::query()->findOrFail($experimentId);

        $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experimentId}")
            ->assertNoContent();

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => AuditLog::ENTITY_TYPE_EXPERIMENT,
            'entity_id' => $experiment->id,
            'action' => AuditLog::ACTION_DELETE,
            'user_id' => $user->id,
        ]);
    }

    public function test_experiment_create_log_contains_after_without_updated_at(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $createResponse = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
                'title' => 'Experiment create payload',
                'type' => 'interview',
            ]);

        $createResponse->assertCreated();
        $experimentId = (int) $createResponse->json('data.id');

        $log = AuditLog::query()
            ->where('entity_type', AuditLog::ENTITY_TYPE_EXPERIMENT)
            ->where('entity_id', $experimentId)
            ->where('action', AuditLog::ACTION_CREATE)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);

        $after = $log->changes['after'] ?? [];

        $this->assertSame($experimentId, (int) data_get($after, 'id'));
        $this->assertSame('Experiment create payload', data_get($after, 'title'));
        $this->assertArrayNotHasKey('updated_at', $after);
    }

    public function test_experiment_update_log_contains_before_and_after_without_updated_at(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $createResponse = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
                'title' => 'Experiment baseline',
                'type' => 'interview',
            ]);

        $createResponse->assertCreated();
        $experimentId = (int) $createResponse->json('data.id');

        $this
            ->actingAs($user, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experimentId}", [
                'title' => 'Experiment changed',
            ])
            ->assertOk();

        $log = AuditLog::query()
            ->where('entity_type', AuditLog::ENTITY_TYPE_EXPERIMENT)
            ->where('entity_id', $experimentId)
            ->where('action', AuditLog::ACTION_UPDATE)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);

        $before = $log->changes['before'] ?? [];
        $after = $log->changes['after'] ?? [];

        $this->assertSame('Experiment baseline', data_get($before, 'title'));
        $this->assertSame('Experiment changed', data_get($after, 'title'));
        $this->assertArrayNotHasKey('updated_at', $before);
        $this->assertArrayNotHasKey('updated_at', $after);
    }

    public function test_experiment_delete_log_contains_before_without_updated_at(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $createResponse = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/experiments", [
                'title' => 'Experiment to remove',
                'type' => 'interview',
            ]);

        $createResponse->assertCreated();
        $experimentId = (int) $createResponse->json('data.id');

        $experiment = Experiment::query()->findOrFail($experimentId);

        $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/v1/hypotheses/{$hypothesis->id}/experiments/{$experimentId}")
            ->assertNoContent();

        $log = AuditLog::query()
            ->where('entity_type', AuditLog::ENTITY_TYPE_EXPERIMENT)
            ->where('entity_id', $experiment->id)
            ->where('action', AuditLog::ACTION_DELETE)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);

        $before = $log->changes['before'] ?? [];

        $this->assertSame($experiment->id, (int) data_get($before, 'id'));
        $this->assertSame('Experiment to remove', data_get($before, 'title'));
        $this->assertArrayNotHasKey('updated_at', $before);
    }

    public function test_audit_log_index_accepts_all_configured_entity_types(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        foreach (AuditLog::ENTITY_TYPES as $index => $entityType) {
            AuditLog::factory()->create([
                'entity_type' => $entityType,
                'entity_id' => 9000 + $index,
                'action' => AuditLog::ACTION_UPDATE,
            ]);

            $response = $this
                ->actingAs($admin, 'web')
                ->getJson("/api/v1/audit-log?entity_type={$entityType}");

            $response
                ->assertOk()
                ->assertJsonCount(1, 'data');

            $this->assertSame($entityType, data_get($response->json('data'), '0.entity_type'));
        }
    }

    public function test_audit_log_index_accepts_all_configured_actions(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        foreach (AuditLog::ACTIONS as $index => $action) {
            AuditLog::factory()->create([
                'entity_type' => AuditLog::ENTITY_TYPE_HYPOTHESIS,
                'entity_id' => 9100 + $index,
                'action' => $action,
            ]);

            $response = $this
                ->actingAs($admin, 'web')
                ->getJson("/api/v1/audit-log?action={$action}");

            $response
                ->assertOk()
                ->assertJsonCount(1, 'data');

            $this->assertSame($action, data_get($response->json('data'), '0.action'));
        }
    }

    public function test_unauthenticated_user_cannot_access_audit_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();

        $this->getJson('/api/v1/audit-log')->assertUnauthorized();
        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/history")->assertUnauthorized();
    }

    public function test_audit_logs_migration_has_indexes_for_filterable_fields(): void
    {
        $driver = \DB::getDriverName();

        if (str_contains(strtolower($driver), 'sqlite')) {
            $indexNames = collect(\DB::select("PRAGMA index_list('audit_logs')"))
                ->pluck('name')
                ->map(static fn ($name): string => (string) $name)
                ->all();

            $this->assertContains('audit_logs_entity_type_entity_id_index', $indexNames);
            $this->assertContains('audit_logs_action_index', $indexNames);
            $this->assertContains('audit_logs_user_id_index', $indexNames);
            $this->assertContains('audit_logs_created_at_index', $indexNames);

            return;
        }

        /** @var array<int, array<string, mixed>> $indexes */
        $indexes = collect(
            \DB::select(
                <<<'SQL'
                SELECT
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'audit_logs'
                SQL,
            ),
        )
            ->map(static fn ($row): array => [
                'name' => (string) data_get($row, 'indexname'),
                'def' => (string) data_get($row, 'indexdef'),
            ])
            ->values()
            ->all();

        $indexDefs = array_map(static fn (array $index): string => $index['def'], $indexes);

        $this->assertTrue(
            collect($indexDefs)->contains(static fn (string $def): bool => str_contains($def, '(entity_type, entity_id)')),
        );
        $this->assertTrue(
            collect($indexDefs)->contains(static fn (string $def): bool => str_contains($def, '(action)')),
        );
        $this->assertTrue(
            collect($indexDefs)->contains(static fn (string $def): bool => str_contains($def, '(user_id)')),
        );
        $this->assertTrue(
            collect($indexDefs)->contains(static fn (string $def): bool => str_contains($def, '(created_at)')),
        );
    }
}
