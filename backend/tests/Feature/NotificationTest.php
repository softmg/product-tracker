<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Events\CommitteeDecisionFinalized;
use App\Events\HypothesisStatusChanged;
use App\Events\SlaWarning;
use App\Jobs\SendTelegramNotification;
use App\Models\CommitteeMember;
use App\Models\Hypothesis;
use App\Models\Notification;
use App\Models\NotificationEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_created_on_status_change(): void
    {
        NotificationEvent::factory()->create([
            'event_type' => 'status_change',
            'is_active' => true,
            'recipients' => ['owner'],
            'template' => 'Hypothesis {hyp_id} moved to {new_status}',
            'channel' => 'in_app',
        ]);

        $owner = User::factory()->create();
        $actor = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'owner_id' => $owner->id,
            'initiator_id' => $actor->id,
            'status' => HypothesisStatus::Backlog,
        ]);

        event(new HypothesisStatusChanged(
            $hypothesis,
            HypothesisStatus::Backlog,
            HypothesisStatus::Scoring,
            $actor,
        ));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'hypothesis_id' => $hypothesis->id,
            'type' => 'status_change',
            'is_read' => false,
        ]);
    }

    public function test_inactive_notification_event_does_not_create_notifications(): void
    {
        NotificationEvent::factory()->create([
            'event_type' => 'status_change',
            'is_active' => false,
            'recipients' => ['owner'],
        ]);

        $owner = User::factory()->create();
        $actor = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'owner_id' => $owner->id,
            'initiator_id' => $actor->id,
            'status' => HypothesisStatus::Backlog,
        ]);

        event(new HypothesisStatusChanged(
            $hypothesis,
            HypothesisStatus::Backlog,
            HypothesisStatus::Scoring,
            $actor,
        ));

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_telegram_job_dispatched_when_channel_is_telegram(): void
    {
        Queue::fake();

        NotificationEvent::factory()->create([
            'event_type' => 'status_change',
            'is_active' => true,
            'recipients' => ['owner'],
            'template' => 'Hypothesis {hyp_id} moved to {new_status}',
            'channel' => 'telegram',
        ]);

        $owner = User::factory()->create();
        $actor = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'owner_id' => $owner->id,
            'initiator_id' => $actor->id,
            'status' => HypothesisStatus::Backlog,
        ]);

        event(new HypothesisStatusChanged(
            $hypothesis,
            HypothesisStatus::Backlog,
            HypothesisStatus::Scoring,
            $actor,
        ));

        Queue::assertPushed(SendTelegramNotification::class);
    }

    public function test_user_can_list_only_own_notifications(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Notification::factory()->count(3)->create([
            'user_id' => $user->id,
        ]);

        Notification::factory()->count(2)->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/notifications');

        $response
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_user_can_filter_notifications_by_read_status(): void
    {
        $user = User::factory()->create();

        Notification::factory()->count(2)->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => true,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/notifications?is_read=0');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();

        $notification = Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->patchJson("/api/v1/notifications/{$notification->id}/read");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $notification->id)
            ->assertJsonPath('data.is_read', true);

        $this->assertTrue((bool) $notification->fresh()->is_read);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Notification::factory()->count(2)->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => true,
        ]);

        Notification::factory()->create([
            'user_id' => $otherUser->id,
            'is_read' => false,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson('/api/v1/notifications/mark-all-read');

        $response
            ->assertOk()
            ->assertJsonPath('meta.updated', 2);

        $this->assertSame(0, Notification::query()->where('user_id', $user->id)->where('is_read', false)->count());
        $this->assertSame(1, Notification::query()->where('user_id', $otherUser->id)->where('is_read', false)->count());
    }

    public function test_user_can_get_unread_notifications_count(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Notification::factory()->count(2)->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => true,
        ]);

        Notification::factory()->create([
            'user_id' => $otherUser->id,
            'is_read' => false,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson('/api/v1/notifications/unread-count');

        $response
            ->assertOk()
            ->assertJsonPath('count', 2);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $notification = Notification::factory()->create([
            'user_id' => $otherUser->id,
            'is_read' => false,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->patchJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertNotFound();
    }

    public function test_sla_warning_event_creates_notifications_for_owner_and_initiator(): void
    {
        NotificationEvent::factory()->create([
            'event_type' => 'sla_warning',
            'is_active' => true,
            'recipients' => ['owner', 'initiator'],
            'template' => 'SLA warning for {hyp_id}: {days_left} days left',
            'channel' => 'in_app',
        ]);

        $owner = User::factory()->create();
        $initiator = User::factory()->create();

        $hypothesis = Hypothesis::factory()->create([
            'owner_id' => $owner->id,
            'initiator_id' => $initiator->id,
            'status' => HypothesisStatus::Scoring,
            'sla_deadline' => now()->addDay(),
            'sla_status' => 'warning',
        ]);

        event(new SlaWarning($hypothesis));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'sla_warning',
            'hypothesis_id' => $hypothesis->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $initiator->id,
            'type' => 'sla_warning',
            'hypothesis_id' => $hypothesis->id,
        ]);
    }

    public function test_committee_decision_event_creates_notifications_for_committee_members(): void
    {
        NotificationEvent::factory()->create([
            'event_type' => 'committee_decision',
            'is_active' => true,
            'recipients' => ['committee'],
            'template' => 'Committee made decision for {hyp_id}: {decision}',
            'channel' => 'in_app',
        ]);

        $actor = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $committeeUserA = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        $committeeUserB = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        CommitteeMember::factory()->create([
            'user_id' => $committeeUserA->id,
            'is_active' => true,
        ]);

        CommitteeMember::factory()->create([
            'user_id' => $committeeUserB->id,
            'is_active' => true,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
            'owner_id' => $actor->id,
            'initiator_id' => $actor->id,
        ]);

        event(new CommitteeDecisionFinalized(
            $hypothesis,
            'go',
            3,
            2,
            $actor,
        ));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $committeeUserA->id,
            'type' => 'committee_decision',
            'hypothesis_id' => $hypothesis->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $committeeUserB->id,
            'type' => 'committee_decision',
            'hypothesis_id' => $hypothesis->id,
        ]);
    }

    public function test_notification_message_template_placeholders_are_resolved(): void
    {
        NotificationEvent::factory()->create([
            'event_type' => 'status_change',
            'is_active' => true,
            'recipients' => ['owner'],
            'template' => 'Hypothesis {hyp_id} moved from {old_status} to {new_status}',
            'channel' => 'in_app',
        ]);

        $owner = User::factory()->create();
        $actor = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'owner_id' => $owner->id,
            'initiator_id' => $actor->id,
            'status' => HypothesisStatus::Backlog,
        ]);

        event(new HypothesisStatusChanged(
            $hypothesis,
            HypothesisStatus::Backlog,
            HypothesisStatus::Scoring,
            $actor,
        ));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'status_change',
            'message' => "Hypothesis {$hypothesis->id} moved from backlog to scoring",
        ]);
    }

    public function test_unauthenticated_user_cannot_access_notifications_endpoints(): void
    {
        $notification = Notification::factory()->create();

        $this->getJson('/api/v1/notifications')->assertUnauthorized();
        $this->patchJson("/api/v1/notifications/{$notification->id}/read")->assertUnauthorized();
        $this->postJson('/api/v1/notifications/mark-all-read')->assertUnauthorized();
        $this->getJson('/api/v1/notifications/unread-count')->assertUnauthorized();
    }
}
