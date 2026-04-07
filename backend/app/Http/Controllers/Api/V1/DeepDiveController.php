<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddDeepDiveCommentRequest;
use App\Http\Requests\UpdateDeepDiveStageRequest;
use App\Http\Resources\DeepDiveResource;
use App\Models\DeepDiveStage;
use App\Models\Hypothesis;
use App\Models\HypothesisDeepDive;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeepDiveController extends Controller
{
    public function index(Hypothesis $hypothesis): AnonymousResourceCollection
    {
        $stages = DeepDiveStage::query()
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        $records = $stages->map(function (DeepDiveStage $stage) use ($hypothesis): HypothesisDeepDive {
            $record = HypothesisDeepDive::query()->firstOrCreate(
                [
                    'hypothesis_id' => $hypothesis->id,
                    'stage_id' => $stage->id,
                ],
                [
                    'is_completed' => false,
                    'comments' => [],
                ],
            );

            $record->setRelation('stage', $stage);

            return $record;
        });

        return DeepDiveResource::collection($records);
    }

    public function update(UpdateDeepDiveStageRequest $request, Hypothesis $hypothesis, DeepDiveStage $stage): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validated();
        $isCompleted = (bool) $validated['is_completed'];

        $record = HypothesisDeepDive::query()->firstOrCreate(
            [
                'hypothesis_id' => $hypothesis->id,
                'stage_id' => $stage->id,
            ],
            [
                'comments' => [],
            ],
        );

        $comments = is_array($record->comments) ? $record->comments : [];

        if (! empty($validated['comment'])) {
            $comments[] = [
                'author_id' => $user->id,
                'text' => $validated['comment'],
                'created_at' => now()->toIso8601String(),
            ];
        }

        $record->update([
            'is_completed' => $isCompleted,
            'completed_by' => $isCompleted ? $user->id : null,
            'completed_at' => $isCompleted ? now() : null,
            'comments' => $comments,
        ]);

        return (new DeepDiveResource($record->fresh()->load('stage')))->response();
    }

    public function addComment(AddDeepDiveCommentRequest $request, Hypothesis $hypothesis, DeepDiveStage $stage): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $record = HypothesisDeepDive::query()->firstOrCreate(
            [
                'hypothesis_id' => $hypothesis->id,
                'stage_id' => $stage->id,
            ],
            [
                'is_completed' => false,
                'comments' => [],
            ],
        );

        $comments = is_array($record->comments) ? $record->comments : [];
        $comments[] = [
            'author_id' => $user->id,
            'text' => (string) $request->validated('text'),
            'created_at' => now()->toIso8601String(),
        ];

        $record->update([
            'comments' => $comments,
        ]);

        return (new DeepDiveResource($record->fresh()->load('stage')))->response();
    }

    public function progress(Hypothesis $hypothesis): JsonResponse
    {
        $stages = DeepDiveStage::query()
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        foreach ($stages as $stage) {
            HypothesisDeepDive::query()->firstOrCreate(
                [
                    'hypothesis_id' => $hypothesis->id,
                    'stage_id' => $stage->id,
                ],
                [
                    'is_completed' => false,
                    'comments' => [],
                ],
            );
        }

        $records = HypothesisDeepDive::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->with('stage')
            ->get();

        $requiredRecords = $records->filter(static fn (HypothesisDeepDive $record): bool => (bool) $record->stage?->is_required);

        return response()->json([
            'data' => [
                'total' => $records->count(),
                'completed' => $records->where('is_completed', true)->count(),
                'required_total' => $requiredRecords->count(),
                'required_completed' => $requiredRecords->where('is_completed', true)->count(),
            ],
        ]);
    }
}
