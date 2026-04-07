<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\DeepDiveStage;
use App\Models\NotificationEvent;
use App\Models\ScoringCriterion;
use App\Models\ScoringThresholdConfig;
use App\Models\SlaConfig;
use App\Models\StatusTransition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_status_transition(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/status-transitions', [
                'from_status' => HypothesisStatus::Backlog->value,
                'to_status' => HypothesisStatus::Scoring->value,
                'allowed_roles' => [UserRole::PdManager->value],
                'condition_type' => 'none',
                'condition_value' => null,
                'is_active' => true,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.from_status', HypothesisStatus::Backlog->value)
            ->assertJsonPath('data.to_status', HypothesisStatus::Scoring->value);

        $transition = StatusTransition::query()
            ->where('from_status', HypothesisStatus::Backlog->value)
            ->where('to_status', HypothesisStatus::Scoring->value)
            ->first();

        $this->assertNotNull($transition);
        $this->assertSame([UserRole::PdManager->value], $transition->allowed_roles);
    }

    public function test_admin_can_update_scoring_threshold(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        ScoringThresholdConfig::query()->create([
            'primary_threshold' => 7.00,
            'deep_threshold' => 7.00,
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->putJson('/api/v1/admin/scoring-thresholds', [
                'primary_threshold' => 6.50,
                'deep_threshold' => 8.00,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.primary_threshold', '6.50')
            ->assertJsonPath('data.deep_threshold', '8.00');

        $config = ScoringThresholdConfig::query()->first();

        $this->assertNotNull($config);
        $this->assertEquals(6.50, (float) $config->primary_threshold);
        $this->assertEquals(8.00, (float) $config->deep_threshold);
    }

    public function test_admin_can_update_scoring_threshold_when_existing_record_id_is_not_one(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $existingConfigId = 42;

        ScoringThresholdConfig::query()->insert([
            'id' => $existingConfigId,
            'primary_threshold' => 5.00,
            'deep_threshold' => 5.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $existingConfig = ScoringThresholdConfig::query()->findOrFail($existingConfigId);

        $this->assertNotSame(1, $existingConfig->id);

        $response = $this
            ->actingAs($admin, 'web')
            ->putJson('/api/v1/admin/scoring-thresholds', [
                'primary_threshold' => 6.50,
                'deep_threshold' => 8.00,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $existingConfig->id)
            ->assertJsonPath('data.primary_threshold', '6.50')
            ->assertJsonPath('data.deep_threshold', '8.00');

        $this->assertSame(1, ScoringThresholdConfig::query()->count());

        $config = ScoringThresholdConfig::query()->first();

        $this->assertNotNull($config);
        $this->assertSame($existingConfig->id, $config->id);
        $this->assertEquals(6.50, (float) $config->primary_threshold);
        $this->assertEquals(8.00, (float) $config->deep_threshold);
    }

    public function test_admin_can_manage_scoring_criteria(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $createResponse = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/scoring-criteria', [
                'name' => 'Market attractiveness',
                'description' => 'How attractive is target market',
                'input_type' => 'slider',
                'min_value' => 1,
                'max_value' => 5,
                'weight' => 1.50,
                'thresholds' => [
                    'warning' => 2,
                    'target' => 4,
                ],
                'is_stop_factor' => false,
                'stage' => 'primary',
                'order' => 1,
                'is_active' => true,
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'Market attractiveness');

        $criterionId = (int) $createResponse->json('data.id');

        $updateResponse = $this
            ->actingAs($admin, 'web')
            ->putJson("/api/v1/admin/scoring-criteria/{$criterionId}", [
                'weight' => 2.00,
                'is_active' => false,
            ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.weight', '2.00')
            ->assertJsonPath('data.is_active', false);

        $deleteResponse = $this
            ->actingAs($admin, 'web')
            ->deleteJson("/api/v1/admin/scoring-criteria/{$criterionId}");

        $deleteResponse->assertNoContent();

        $this->assertDatabaseMissing('scoring_criteria', [
            'id' => $criterionId,
        ]);
    }

    public function test_admin_can_manage_sla_configs(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $createResponse = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/sla-configs', [
                'status' => HypothesisStatus::Scoring->value,
                'limit_days' => 10,
                'warning_days' => 3,
                'is_active' => true,
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.status', HypothesisStatus::Scoring->value);

        $configId = (int) $createResponse->json('data.id');

        $updateResponse = $this
            ->actingAs($admin, 'web')
            ->putJson("/api/v1/admin/sla-configs/{$configId}", [
                'warning_days' => 4,
                'is_active' => false,
            ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.warning_days', 4)
            ->assertJsonPath('data.is_active', false);

        $deleteResponse = $this
            ->actingAs($admin, 'web')
            ->deleteJson("/api/v1/admin/sla-configs/{$configId}");

        $deleteResponse->assertNoContent();

        $this->assertDatabaseMissing('sla_configs', [
            'id' => $configId,
        ]);
    }

    public function test_admin_can_manage_notification_events(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $createResponse = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/notification-events', [
                'event_type' => 'test_event',
                'is_active' => true,
                'recipients' => ['owner', 'initiator'],
                'template' => 'Test template for {hyp_id}',
                'channel' => 'in_app',
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.event_type', 'test_event');

        $eventId = (int) $createResponse->json('data.id');

        $updateResponse = $this
            ->actingAs($admin, 'web')
            ->putJson("/api/v1/admin/notification-events/{$eventId}", [
                'channel' => 'telegram',
                'is_active' => false,
            ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.channel', 'telegram')
            ->assertJsonPath('data.is_active', false);

        $deleteResponse = $this
            ->actingAs($admin, 'web')
            ->deleteJson("/api/v1/admin/notification-events/{$eventId}");

        $deleteResponse->assertNoContent();

        $this->assertDatabaseMissing('notification_events', [
            'id' => $eventId,
        ]);
    }

    public function test_admin_can_manage_deep_dive_stages_and_reorder(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $first = DeepDiveStage::factory()->create([
            'name' => 'First stage',
            'order' => 1,
            'responsible_role' => UserRole::Analyst->value,
        ]);

        $second = DeepDiveStage::factory()->create([
            'name' => 'Second stage',
            'order' => 2,
            'responsible_role' => UserRole::PdManager->value,
        ]);

        $this
            ->actingAs($admin, 'web')
            ->putJson("/api/v1/admin/deep-dive-stages/{$first->id}", [
                'order' => 10,
            ])
            ->assertOk();

        $this
            ->actingAs($admin, 'web')
            ->putJson("/api/v1/admin/deep-dive-stages/{$second->id}", [
                'order' => 1,
            ])
            ->assertOk();

        $response = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/admin/deep-dive-stages');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $second->id)
            ->assertJsonPath('data.1.id', $first->id);
    }

    public function test_non_admin_cannot_access_configuration_endpoints(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $this->actingAs($user, 'web')->getJson('/api/v1/admin/status-transitions')->assertForbidden();
        $this->actingAs($user, 'web')->getJson('/api/v1/admin/scoring-criteria')->assertForbidden();
        $this->actingAs($user, 'web')->getJson('/api/v1/admin/scoring-thresholds')->assertForbidden();
        $this->actingAs($user, 'web')->getJson('/api/v1/admin/sla-configs')->assertForbidden();
        $this->actingAs($user, 'web')->getJson('/api/v1/admin/notification-events')->assertForbidden();
        $this->actingAs($user, 'web')->getJson('/api/v1/admin/deep-dive-stages')->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_configuration_endpoints(): void
    {
        $this->getJson('/api/v1/admin/status-transitions')->assertUnauthorized();
        $this->getJson('/api/v1/admin/scoring-criteria')->assertUnauthorized();
        $this->getJson('/api/v1/admin/scoring-thresholds')->assertUnauthorized();
        $this->getJson('/api/v1/admin/sla-configs')->assertUnauthorized();
        $this->getJson('/api/v1/admin/notification-events')->assertUnauthorized();
        $this->getJson('/api/v1/admin/deep-dive-stages')->assertUnauthorized();
    }
}
