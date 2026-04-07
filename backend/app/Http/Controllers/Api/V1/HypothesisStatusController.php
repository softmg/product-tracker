<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\HypothesisStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChangeStatusRequest;
use App\Http\Resources\HypothesisResource;
use App\Models\Hypothesis;
use App\Models\User;
use App\Services\StatusMachineService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HypothesisStatusController extends Controller
{
    public function __construct(private readonly StatusMachineService $statusMachineService)
    {
    }

    public function transitions(Request $request, Hypothesis $hypothesis): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $transitions = $this->statusMachineService
            ->getAvailableTransitions($hypothesis, $user)
            ->map(fn ($transition): array => [
                'from_status' => $transition->from_status,
                'to_status' => $transition->to_status,
                'condition_type' => $transition->condition_type,
                'condition_value' => $transition->condition_value,
            ])
            ->values();

        return response()->json([
            'data' => $transitions,
        ]);
    }

    public function transition(ChangeStatusRequest $request, Hypothesis $hypothesis): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        try {
            $updated = $this->statusMachineService->transition(
                $hypothesis,
                HypothesisStatus::from($request->validated('to_status')),
                $user,
                $request->validated('comment'),
            );
        } catch (DomainException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], str_contains($exception->getMessage(), 'role') ? 403 : 422);
        }

        return response()->json([
            'data' => new HypothesisResource($updated->load([
                'initiator',
                'owner',
                'team',
                'scorings',
                'deepDives.stage',
                'experiments',
                'committeeVotes.member.user',
                'statusHistory.changedBy',
            ])),
        ]);
    }
}
