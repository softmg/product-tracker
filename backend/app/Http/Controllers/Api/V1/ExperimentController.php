<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExperimentRequest;
use App\Http\Requests\UpdateExperimentRequest;
use App\Http\Requests\UpdateExperimentResultRequest;
use App\Http\Resources\ExperimentResource;
use App\Models\Experiment;
use App\Models\Hypothesis;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ExperimentController extends Controller
{
    public function index(Hypothesis $hypothesis): AnonymousResourceCollection
    {
        $experiments = Experiment::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->with('metrics')
            ->orderByDesc('id')
            ->get();

        return ExperimentResource::collection($experiments);
    }

    public function store(StoreExperimentRequest $request, Hypothesis $hypothesis): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $experiment = DB::transaction(function () use ($validated, $hypothesis, $user): Experiment {
            $metrics = $validated['metrics'] ?? [];
            unset($validated['metrics']);

            $experiment = Experiment::query()->create([
                ...$validated,
                'hypothesis_id' => $hypothesis->id,
                'created_by' => $user->id,
                'status' => $validated['status'] ?? 'planned',
            ]);

            $this->replaceMetrics($experiment, $metrics);

            return $experiment;
        });

        return (new ExperimentResource($experiment->fresh()->load('metrics')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateExperimentRequest $request, Hypothesis $hypothesis, Experiment $experiment): ExperimentResource
    {
        $this->ensureExperimentBelongsToHypothesis($hypothesis, $experiment);

        $validated = $request->validated();

        DB::transaction(function () use ($experiment, $validated): void {
            $metrics = $validated['metrics'] ?? null;
            unset($validated['metrics']);

            if ($validated !== []) {
                $experiment->update($validated);
            }

            if (is_array($metrics)) {
                $this->replaceMetrics($experiment, $metrics);
            }
        });

        return new ExperimentResource($experiment->fresh()->load('metrics'));
    }

    public function destroy(Hypothesis $hypothesis, Experiment $experiment): JsonResponse
    {
        $this->ensureExperimentBelongsToHypothesis($hypothesis, $experiment);

        $experiment->delete();

        return response()->json([], 204);
    }

    public function updateResult(UpdateExperimentResultRequest $request, Experiment $experiment): ExperimentResource
    {
        $experiment->update($request->validated());

        return new ExperimentResource($experiment->fresh()->load('metrics'));
    }

    /**
     * @param array<int, array<string, mixed>> $metrics
     */
    private function replaceMetrics(Experiment $experiment, array $metrics): void
    {
        $experiment->metrics()->delete();

        if ($metrics === []) {
            return;
        }

        $payload = array_map(static fn (array $metric): array => [
            'name' => $metric['name'],
            'target_value' => $metric['target_value'] ?? null,
            'actual_value' => $metric['actual_value'] ?? null,
            'unit' => $metric['unit'] ?? null,
            'result' => $metric['result'] ?? null,
        ], $metrics);

        $experiment->metrics()->createMany($payload);
    }

    private function ensureExperimentBelongsToHypothesis(Hypothesis $hypothesis, Experiment $experiment): void
    {
        abort_unless($experiment->hypothesis_id === $hypothesis->id, 404);
    }
}
