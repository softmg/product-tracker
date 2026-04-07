<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRespondentPainRequest;
use App\Http\Requests\StoreRespondentRequest;
use App\Http\Requests\UpdateRespondentRequest;
use App\Http\Resources\PainSummaryResource;
use App\Http\Resources\RespondentPainResource;
use App\Http\Resources\RespondentResource;
use App\Models\Hypothesis;
use App\Models\Respondent;
use App\Models\RespondentPain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RespondentController extends Controller
{
    public function index(Request $request, Hypothesis $hypothesis): AnonymousResourceCollection
    {
        $query = Respondent::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->withCount('pains');

        $status = $request->query('status');
        if (is_string($status) && $status !== '') {
            $query->where('status', $status);
        }

        $respondents = $query
            ->orderByDesc('id')
            ->get();

        return RespondentResource::collection($respondents);
    }

    public function store(StoreRespondentRequest $request, Hypothesis $hypothesis): JsonResponse
    {
        $respondent = Respondent::query()->create([
            ...$request->validated(),
            'hypothesis_id' => $hypothesis->id,
            'status' => $request->validated('status') ?? 'new',
        ]);

        return (new RespondentResource($respondent->loadCount('pains')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateRespondentRequest $request, Hypothesis $hypothesis, Respondent $respondent): RespondentResource
    {
        $this->ensureRespondentBelongsToHypothesis($hypothesis, $respondent);

        $respondent->update($request->validated());

        return new RespondentResource($respondent->fresh()->loadCount('pains'));
    }

    public function destroy(Hypothesis $hypothesis, Respondent $respondent): JsonResponse
    {
        $this->ensureRespondentBelongsToHypothesis($hypothesis, $respondent);

        $respondent->delete();

        return response()->json([], 204);
    }

    public function addPain(StoreRespondentPainRequest $request, Respondent $respondent): JsonResponse
    {
        $pain = $respondent->pains()->create($request->validated());

        return (new RespondentPainResource($pain))
            ->response()
            ->setStatusCode(201);
    }

    public function removePain(Respondent $respondent, RespondentPain $pain): JsonResponse
    {
        abort_unless($pain->respondent_id === $respondent->id, 404);

        $pain->delete();

        return response()->json([], 204);
    }

    public function painSummary(Hypothesis $hypothesis): AnonymousResourceCollection
    {
        $pains = RespondentPain::query()
            ->whereHas('respondent', static function ($query) use ($hypothesis): void {
                $query->where('hypothesis_id', $hypothesis->id);
            })
            ->with('respondent:id,name')
            ->get();

        $summary = $pains
            ->groupBy('tag')
            ->map(static function ($items, $tag): array {
                $respondentNames = $items
                    ->pluck('respondent.name')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

                sort($respondentNames);

                return [
                    'tag' => (string) $tag,
                    'count' => $items->count(),
                    'respondent_names' => $respondentNames,
                ];
            })
            ->sortBy('tag')
            ->values();

        return PainSummaryResource::collection($summary);
    }

    private function ensureRespondentBelongsToHypothesis(Hypothesis $hypothesis, Respondent $respondent): void
    {
        abort_unless($respondent->hypothesis_id === $hypothesis->id, 404);
    }
}
