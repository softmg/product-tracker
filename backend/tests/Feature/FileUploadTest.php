<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Hypothesis;
use App\Models\HypothesisFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upload_file_for_hypothesis(): void
    {
        Storage::fake('hypothesis-files');

        $user = User::factory()->create([
            'role' => UserRole::Analyst,
        ]);

        $hypothesis = Hypothesis::factory()->create([
            'owner_id' => $user->id,
            'initiator_id' => $user->id,
        ]);

        $file = UploadedFile::fake()->create('research.pdf', 512, 'application/pdf');

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/files", [
                'file' => $file,
                'stage' => 'deep_dive',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.hypothesis_id', $hypothesis->id)
            ->assertJsonPath('data.name', 'research.pdf')
            ->assertJsonPath('data.stage', 'deep_dive');

        $record = HypothesisFile::query()->where('hypothesis_id', $hypothesis->id)->first();

        $this->assertNotNull($record);
        $this->assertDatabaseHas('hypothesis_files', [
            'id' => $record->id,
            'uploaded_by' => $user->id,
            'mime_type' => 'application/pdf',
        ]);

        Storage::disk('hypothesis-files')->assertExists($record->path);
    }

    public function test_user_can_list_files_for_hypothesis_and_filter_by_stage(): void
    {
        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        HypothesisFile::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'uploaded_by' => $user->id,
            'stage' => 'deep_dive',
        ]);

        HypothesisFile::factory()->create([
            'hypothesis_id' => $hypothesis->id,
            'uploaded_by' => $user->id,
            'stage' => 'experiment',
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->getJson("/api/v1/hypotheses/{$hypothesis->id}/files?stage=deep_dive");

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.stage', 'deep_dive');
    }

    public function test_user_can_download_file(): void
    {
        Storage::fake('hypothesis-files');

        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        Storage::disk('hypothesis-files')->put('hypothesis-files/'.$hypothesis->id.'/artifact.txt', 'artifact-content');

        $file = HypothesisFile::query()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage' => 'experiment',
            'name' => 'artifact.txt',
            'path' => 'hypothesis-files/'.$hypothesis->id.'/artifact.txt',
            'mime_type' => 'text/plain',
            'size' => 15,
            'uploaded_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->get("/api/v1/files/{$file->id}/download");

        $response
            ->assertOk()
            ->assertHeader('content-disposition');
    }

    public function test_user_can_delete_file_and_storage_object(): void
    {
        Storage::fake('hypothesis-files');

        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        Storage::disk('hypothesis-files')->put('hypothesis-files/'.$hypothesis->id.'/to-delete.pdf', 'content');

        $file = HypothesisFile::query()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage' => 'deep_dive',
            'name' => 'to-delete.pdf',
            'path' => 'hypothesis-files/'.$hypothesis->id.'/to-delete.pdf',
            'mime_type' => 'application/pdf',
            'size' => 7,
            'uploaded_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user, 'web')
            ->deleteJson("/api/v1/files/{$file->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('hypothesis_files', [
            'id' => $file->id,
        ]);

        Storage::disk('hypothesis-files')->assertMissing('hypothesis-files/'.$hypothesis->id.'/to-delete.pdf');
    }

    public function test_upload_validation_rejects_files_above_20mb(): void
    {
        Storage::fake('hypothesis-files');

        $user = User::factory()->create();
        $hypothesis = Hypothesis::factory()->create();

        $bigFile = UploadedFile::fake()->create('too-big.pdf', 21 * 1024, 'application/pdf');

        $response = $this
            ->actingAs($user, 'web')
            ->postJson("/api/v1/hypotheses/{$hypothesis->id}/files", [
                'file' => $bigFile,
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_unauthenticated_user_cannot_access_file_endpoints(): void
    {
        $hypothesis = Hypothesis::factory()->create();
        $file = HypothesisFile::factory()->create();

        $this->getJson("/api/v1/hypotheses/{$hypothesis->id}/files")->assertUnauthorized();
        $this->postJson("/api/v1/hypotheses/{$hypothesis->id}/files", [])->assertUnauthorized();
        $this->getJson("/api/v1/files/{$file->id}/download")->assertUnauthorized();
        $this->deleteJson("/api/v1/files/{$file->id}")->assertUnauthorized();
    }
}
