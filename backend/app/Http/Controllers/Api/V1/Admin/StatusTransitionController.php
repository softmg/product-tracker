<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStatusTransitionRequest;
use App\Http\Requests\Admin\UpdateStatusTransitionRequest;
use App\Http\Resources\StatusTransitionResource;
use App\Models\StatusTransition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StatusTransitionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $transitions = StatusTransition::query()
            ->orderBy('from_status')
            ->orderBy('to_status')
            ->orderBy('id')
            ->get();

        return StatusTransitionResource::collection($transitions);
    }

    public function store(StoreStatusTransitionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;

        $transition = StatusTransition::query()->create($data);

        return (new StatusTransitionResource($transition))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateStatusTransitionRequest $request, StatusTransition $statusTransition): StatusTransitionResource
    {
        $statusTransition->update($request->validated());

        return new StatusTransitionResource($statusTransition->fresh());
    }

    public function destroy(StatusTransition $statusTransition): JsonResponse
    {
        $statusTransition->delete();

        return response()->json([], 204);
    }
}
