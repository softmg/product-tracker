<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDeepDiveStageRequest;
use App\Http\Requests\Admin\UpdateDeepDiveStageRequest;
use App\Http\Resources\DeepDiveStageResource;
use App\Models\DeepDiveStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeepDiveConfigController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $stages = DeepDiveStage::query()
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        return DeepDiveStageResource::collection($stages);
    }

    public function store(StoreDeepDiveStageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['order'] = $data['order'] ?? 0;
        $data['is_required'] = $data['is_required'] ?? true;
        $data['is_active'] = $data['is_active'] ?? true;

        $stage = DeepDiveStage::query()->create($data);

        return (new DeepDiveStageResource($stage))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateDeepDiveStageRequest $request, DeepDiveStage $deepDiveStage): DeepDiveStageResource
    {
        $deepDiveStage->update($request->validated());

        return new DeepDiveStageResource($deepDiveStage->fresh());
    }

    public function destroy(DeepDiveStage $deepDiveStage): JsonResponse
    {
        $deepDiveStage->delete();

        return response()->json([], 204);
    }
}
