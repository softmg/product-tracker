<?php

declare(strict_types=1);

namespace Tests\Feature\Hypothesis;

use App\Models\Hypothesis;
use App\Models\Respondent;
use App\Models\RespondentPain;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RespondentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_respondents_with_status_filter(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $interviewed = Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'status' => 'interviewed',
            'name' => 'Alice',
        ]);

        Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'status' => 'new',
            'name' => 'Bob',
        ]);

        Respondent::factory()->create([
            'status' => 'interviewed',
            'name' => 'Charlie',
        ]);

        RespondentPain::factory()->create([
            'respondent_id' => $interviewed->id,
            'tag' => 'slow_onboarding',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/respondents?status=interviewed");

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $interviewed->id)
            ->assertJsonPath('data.0.pains_count', 1);
    }

    public function test_user_can_create_respondent(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/respondents", [
                'name' => 'John Doe',
                'company' => 'ACME',
                'position' => 'CTO',
                'contact_source' => 'LinkedIn',
                'email' => 'john@acme.com',
                'status' => 'contacted',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'John Doe')
            ->assertJsonPath('data.status', 'contacted');

        $this->assertDatabaseHas('respondents', [
            'hypothesis_id' => $hypothesis->id,
            'name' => 'John Doe',
            'email' => 'john@acme.com',
        ]);
    }

    public function test_user_can_update_respondent(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();
        $respondent = Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'status' => 'new',
            'name' => 'Initial Name',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->putJson("/api/v1/hypotheses/{$hypothesis->id}/respondents/{$respondent->id}", [
                'name' => 'Updated Name',
                'status' => 'interviewed',
                'email' => 'updated@example.com',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $respondent->id)
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.status', 'interviewed');

        $this->assertDatabaseHas('respondents', [
            'id' => $respondent->id,
            'name' => 'Updated Name',
            'status' => 'interviewed',
            'email' => 'updated@example.com',
        ]);
    }

    public function test_user_can_delete_respondent(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();
        $respondent = Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/v1/hypotheses/{$hypothesis->id}/respondents/{$respondent->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('respondents', [
            'id' => $respondent->id,
        ]);
    }

    public function test_user_can_add_and_remove_pain_for_respondent(): void
    {
        $user = User::factory()->create();
        $respondent = Respondent::factory()->create();

        $createResponse = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/respondents/{$respondent->id}/pains", [
                'tag' => 'slow_onboarding',
                'quote' => 'Integration takes too long',
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.respondent_id', $respondent->id)
            ->assertJsonPath('data.tag', 'slow_onboarding');

        $painId = (int) $createResponse->json('data.id');

        $deleteResponse = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/v1/respondents/{$respondent->id}/pains/{$painId}");

        $deleteResponse->assertNoContent();

        $this->assertDatabaseMissing('respondent_pains', [
            'id' => $painId,
        ]);
    }

    public function test_pain_summary_aggregates_by_tag(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $firstRespondent = Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'name' => 'Alice',
        ]);

        $secondRespondent = Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'name' => 'Bob',
        ]);

        $thirdRespondent = Respondent::factory()->create([
            'name' => 'Eve',
        ]);

        RespondentPain::factory()->create([
            'respondent_id' => $firstRespondent->id,
            'tag' => 'slow_onboarding',
        ]);

        RespondentPain::factory()->create([
            'respondent_id' => $secondRespondent->id,
            'tag' => 'slow_onboarding',
        ]);

        RespondentPain::factory()->create([
            'respondent_id' => $firstRespondent->id,
            'tag' => 'pricing',
        ]);

        RespondentPain::factory()->create([
            'respondent_id' => $thirdRespondent->id,
            'tag' => 'slow_onboarding',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/pain-summary");

        $response->assertOk();

        $summary = collect($response->json('data'));

        $slowOnboarding = $summary->firstWhere('tag', 'slow_onboarding');
        $pricing = $summary->firstWhere('tag', 'pricing');

        $this->assertNotNull($slowOnboarding);
        $this->assertSame(2, $slowOnboarding['count']);

        $respondentNames = $slowOnboarding['respondent_names'];
        sort($respondentNames);
        $this->assertSame(['Alice', 'Bob'], $respondentNames);

        $this->assertNotNull($pricing);
        $this->assertSame(1, $pricing['count']);
    }

    public function test_unauthenticated_user_cannot_access_respondent_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();
        $respondent = Respondent::factory()->create([
            'hypothesis_id' => $hypothesis->id,
        ]);

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/respondents")->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/respondents", [
            'name' => 'John Doe',
        ])->assertUnauthorized();
        $this->putJson("/api/v1/hypotheses/{$hypothesis->id}/respondents/{$respondent->id}", [
            'name' => 'Jane Doe',
        ])->assertUnauthorized();
        $this->deleteJson("/api/v1/hypotheses/{$hypothesis->id}/respondents/{$respondent->id}")->assertUnauthorized();
        $this->postJson("/api/v1/respondents/{$respondent->id}/pains", [
            'tag' => 'pricing',
        ])->assertUnauthorized();
        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/pain-summary")->assertUnauthorized();
    }
}
