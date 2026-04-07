<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHypothesisFileRequest;
use App\Http\Resources\FileResource;
use App\Models\Hypothesis;
use App\Models\HypothesisFile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    public function index(Request $request, Hypothesis $hypothesis): AnonymousResourceCollection
    {
        $query = HypothesisFile::query()->where('hypothesis_id', $hypothesis->id);

        $stage = $request->query('stage');
        if (is_string($stage) && $stage !== '') {
            $query->where('stage', $stage);
        }

        $files = $query
            ->orderByDesc('id')
            ->get();

        return FileResource::collection($files);
    }

    public function store(StoreHypothesisFileRequest $request, Hypothesis $hypothesis): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $uploadedFile = $request->file('file');

        if (! $uploadedFile) {
            abort(422);
        }

        $path = $uploadedFile->store(
            path: 'hypothesis-files/'.$hypothesis->id,
            options: ['disk' => 'hypothesis-files'],
        );

        $file = HypothesisFile::query()->create([
            'hypothesis_id' => $hypothesis->id,
            'stage' => $request->validated('stage'),
            'name' => $uploadedFile->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $uploadedFile->getClientMimeType(),
            'size' => $uploadedFile->getSize(),
            'uploaded_by' => $user->id,
        ]);

        return (new FileResource($file))
            ->response()
            ->setStatusCode(201);
    }

    public function download(Request $request, HypothesisFile $file): StreamedResponse
    {
        if (! Storage::disk('hypothesis-files')->exists($file->path)) {
            abort(404);
        }

        return Storage::disk('hypothesis-files')->download($file->path, $file->name);
    }

    public function destroy(Request $request, HypothesisFile $file): JsonResponse
    {
        Storage::disk('hypothesis-files')->delete($file->path);

        $file->delete();

        return response()->json([], 204);
    }
}
