<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListScoringCriteriaRequest;
use App\Http\Requests\ShowScoringRequest;
use App\Http\Requests\SubmitScoringRequest;
use App\Http\Resources\ScoringCriterionResource;
use App\Http\Resources\ScoringResource;
use App\Models\Hypothesis;
use App\Models\HypothesisScoring;
use App\Models\ScoringCriterion;
use App\Models\User;
use App\Services\ScoringCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ScoringController extends Controller
{
    public function __construct(private readonly ScoringCalculator $scoringCalculator)
    {
    }

    public function show(ShowScoringRequest $request, Hypothesis $hypothesis): JsonResponse
    {
        $stage = (string) $request->validated('stage');

        $scoring = HypothesisScoring::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->where('stage', $stage)
            ->first();

        if (! $scoring) {
            return response()->json(['data' => null]);
        }

        return (new ScoringResource($scoring->load('scoredBy')))->response();
    }

    public function submit(SubmitScoringRequest $request, Hypothesis $hypothesis): JsonResponse
    {
        $validated = $request->validated();

        /** @var User $user */
        $user = $request->user();

        $stage = (string) $validated['stage'];

        /** @var array<int|string, int|float|string> $criteriaScores */
        $criteriaScores = $validated['criteria_scores'];

        $calculation = $this->scoringCalculator->calculate($criteriaScores, $stage);

        $scoring = DB::transaction(function () use ($hypothesis, $stage, $criteriaScores, $calculation, $user): HypothesisScoring {
            $scoring = HypothesisScoring::query()->updateOrCreate(
                [
                    'hypothesis_id' => $hypothesis->id,
                    'stage' => $stage,
                ],
                [
                    'criteria_scores' => $criteriaScores,
                    'total_score' => $calculation['total_score'],
                    'stop_factor_triggered' => $calculation['stop_factor_triggered'],
                    'scored_by' => $user->id,
                ],
            );

            $hypothesis->update([
                $this->scoreColumnForStage($stage) => $calculation['total_score'],
            ]);

            return $scoring;
        });

        return (new ScoringResource($scoring->fresh()->load('scoredBy')))->response();
    }

    public function criteria(ListScoringCriteriaRequest $request): AnonymousResourceCollection
    {
        $stage = (string) $request->validated('stage');

        $criteria = ScoringCriterion::query()
            ->where('stage', $stage)
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        return ScoringCriterionResource::collection($criteria);
    }

    private function scoreColumnForStage(string $stage): string
    {
        return $stage === 'primary' ? 'scoring_primary' : 'scoring_deep';
    }
}
