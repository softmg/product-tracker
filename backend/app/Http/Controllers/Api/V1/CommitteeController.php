<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\CastVoteRequest;
use App\Http\Resources\CommitteeMemberResource;
use App\Http\Resources\CommitteeVoteResource;
use App\Http\Resources\HypothesisResource;
use App\Models\CommitteeMember;
use App\Models\CommitteeVote;
use App\Models\Hypothesis;
use App\Models\User;
use App\Services\CommitteeDecisionService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommitteeController extends Controller
{
    public function __construct(private readonly CommitteeDecisionService $committeeDecisionService)
    {
    }

    public function index(Hypothesis $hypothesis): JsonResponse
    {
        $members = CommitteeMember::query()
            ->where('is_active', true)
            ->with('user')
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $votesByMember = CommitteeVote::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->whereIn('member_id', $members->pluck('id'))
            ->get()
            ->keyBy('member_id');

        $data = $members->map(function (CommitteeMember $member) use ($votesByMember): array {
            $vote = $votesByMember->get($member->id);

            return [
                'member' => (new CommitteeMemberResource($member))->resolve(),
                'vote' => $vote ? (new CommitteeVoteResource($vote->load('member.user')))->resolve() : null,
            ];
        })->values();

        return response()->json([
            'data' => $data,
        ]);
    }

    public function castVote(CastVoteRequest $request, Hypothesis $hypothesis): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $member = CommitteeMember::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (! $member) {
            abort(403);
        }

        $existingVote = CommitteeVote::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->where('member_id', $member->id)
            ->first();

        $vote = CommitteeVote::query()->updateOrCreate(
            [
                'hypothesis_id' => $hypothesis->id,
                'member_id' => $member->id,
            ],
            [
                'vote' => $request->validated('vote'),
                'comment' => $request->validated('comment'),
                'voted_at' => now(),
            ],
        );

        $resource = new CommitteeVoteResource($vote->load('member.user'));

        $statusCode = $existingVote ? 200 : 201;

        return $resource->response()->setStatusCode($statusCode);
    }

    public function finalizeDecision(Request $request, Hypothesis $hypothesis): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! in_array($user->role, [UserRole::Admin, UserRole::PdManager], true)) {
            abort(403);
        }

        try {
            $result = $this->committeeDecisionService->finalize($hypothesis, $user);
        } catch (DomainException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        /** @var Hypothesis $updatedHypothesis */
        $updatedHypothesis = $result['hypothesis'];

        return response()->json([
            'data' => new HypothesisResource($updatedHypothesis->load([
                'initiator',
                'owner',
                'team',
                'scorings',
                'deepDives.stage',
                'experiments.metrics',
                'committeeVotes.member.user',
                'statusHistory.changedBy',
            ])),
            'meta' => [
                'decision' => $result['decision'],
                'total_votes' => $result['total_votes'],
                'winning_votes' => $result['winning_votes'],
            ],
        ]);
    }
}
