<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use App\Models\CommitteeMember;
use App\Models\CommitteeVote;
use App\Models\Hypothesis;
use App\Models\StatusTransition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommitteeVotingTest extends TestCase
{
    use RefreshDatabase;

    public function test_committee_member_can_vote(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        $member = CommitteeMember::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/votes", [
                'vote' => 'go',
                'comment' => 'Looks promising',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.member_id', $member->id)
            ->assertJsonPath('data.vote', 'go');

        $this->assertDatabaseHas('committee_votes', [
            'hypothesis_id' => $hypothesis->id,
            'member_id' => $member->id,
            'vote' => 'go',
        ]);
    }

    public function test_committee_member_can_revote(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        $member = CommitteeMember::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        CommitteeVote::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'member_id' => $member->id,
            'vote' => 'go',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/votes", [
                'vote' => 'no_go',
                'comment' => 'Found blocking risk',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.vote', 'no_go');

        $this->assertDatabaseHas('committee_votes', [
            'hypothesis_id' => $hypothesis->id,
            'member_id' => $member->id,
            'vote' => 'no_go',
            'comment' => 'Found blocking risk',
        ]);

        $this->assertSame(1, CommitteeVote::query()->where('hypothesis_id', $hypothesis->id)->count());
    }

    public function test_non_committee_member_cannot_vote(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Initiator,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/votes", [
                'vote' => 'go',
            ]);

        $response->assertForbidden();
    }

    public function test_can_list_votes_for_hypothesis(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        $memberWithVote = CommitteeMember::factory()->create([
            'is_active' => true,
        ]);

        $memberWithoutVote = CommitteeMember::factory()->create([
            'is_active' => true,
        ]);

        CommitteeVote::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'member_id' => $memberWithVote->id,
            'vote' => 'go',
        ]);

        CommitteeMember::factory()->create([
            'is_active' => false,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/votes");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $ids = collect($response->json('data'))->pluck('member.id')->all();
        sort($ids);

        $expected = [$memberWithVote->id, $memberWithoutVote->id];
        sort($expected);

        $this->assertSame($expected, $ids);
    }

    public function test_finalize_decision_transitions_on_majority_go(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        $members = CommitteeMember::factory()->count(3)->create([
            'is_active' => true,
        ]);

        CommitteeVote::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'member_id' => $members[0]->id,
            'vote' => 'go',
        ]);

        CommitteeVote::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'member_id' => $members[1]->id,
            'vote' => 'go',
        ]);

        CommitteeVote::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'member_id' => $members[2]->id,
            'vote' => 'no_go',
        ]);

        StatusTransition::factory()->create([
            'from_status' => HypothesisStatus::GoNoGo->value,
            'to_status' => HypothesisStatus::Done->value,
            'allowed_roles' => [UserRole::Admin->value],
            'condition_type' => 'none',
        ]);

        $response = $this
            ->actingAs($admin, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/finalize-decision");

        $response
            ->assertOk()
            ->assertJsonPath('data.status', HypothesisStatus::Done->value)
            ->assertJsonPath('meta.decision', 'go')
            ->assertJsonPath('meta.total_votes', 3)
            ->assertJsonPath('meta.winning_votes', 2);
    }

    public function test_finalize_decision_requires_admin_or_pd_manager(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/finalize-decision");

        $response->assertForbidden();
    }

    public function test_admin_can_manage_committee_members(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $user = User::factory()->create([
            'role' => UserRole::Committee,
        ]);

        $createResponse = $this
            ->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/committee-members', [
                'user_id' => $user->id,
                'display_role' => 'chair',
                'order' => 1,
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.display_role', 'chair');

        $memberId = (int) $createResponse->json('data.id');

        $listResponse = $this
            ->actingAs($admin, 'web')
            ->getJson('/api/v1/admin/committee-members');

        $listResponse
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $updateResponse = $this
            ->actingAs($admin, 'web')
            ->putJson("/api/v1/admin/committee-members/{$memberId}", [
                'display_role' => 'expert',
                'order' => 2,
                'is_active' => false,
            ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.display_role', 'expert')
            ->assertJsonPath('data.order', 2)
            ->assertJsonPath('data.is_active', false);

        $deleteResponse = $this
            ->actingAs($admin, 'web')
            ->deleteJson("/api/v1/admin/committee-members/{$memberId}");

        $deleteResponse->assertNoContent();

        $this->assertDatabaseMissing('committee_members', [
            'id' => $memberId,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_committee_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create([
            'status' => HypothesisStatus::GoNoGo,
        ]);

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/votes")->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/votes", [
            'vote' => 'go',
        ])->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/finalize-decision")->assertUnauthorized();
        $this->getJson('/api/v1/admin/committee-members')->assertUnauthorized();
    }
}
