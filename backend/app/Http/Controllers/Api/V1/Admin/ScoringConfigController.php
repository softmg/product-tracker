<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreScoringCriterionRequest;
use App\Http\Requests\Admin\UpdateScoringCriterionRequest;
use App\Http\Resources\ScoringCriterionResource;
use App\Models\ScoringCriterion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ScoringConfigController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ScoringCriterion::query();

        $stage = $request->query('stage');
        if (is_string($stage) && in_array($stage, ['primary', 'deep'], true)) {
            $query->where('stage', $stage);
        }

        $isActive = $request->query('is_active');
        if ($isActive !== null && $isActive !== '') {
            $parsed = filter_var($isActive, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);

            if ($parsed !== null) {
                $query->where('is_active', $parsed);
            }
        }

        $criteria = $query
            ->orderBy('stage')
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        return ScoringCriterionResource::collection($criteria);
    }

    public function store(StoreScoringCriterionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;
        $data['is_stop_factor'] = $data['is_stop_factor'] ?? false;
        $data['order'] = $data['order'] ?? 0;

        $criterion = ScoringCriterion::query()->create($data);

        return (new ScoringCriterionResource($criterion))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateScoringCriterionRequest $request, ScoringCriterion $scoringCriterion): ScoringCriterionResource
    {
        $scoringCriterion->update($request->validated());

        return new ScoringCriterionResource($scoringCriterion->fresh());
    }

    public function destroy(ScoringCriterion $scoringCriterion): JsonResponse
    {
        $scoringCriterion->delete();

        return response()->json([], 204);
    }
}
