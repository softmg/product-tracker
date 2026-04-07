<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSlaConfigRequest;
use App\Http\Requests\Admin\UpdateSlaConfigRequest;
use App\Http\Resources\SlaConfigResource;
use App\Models\SlaConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SlaConfigController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $configs = SlaConfig::query()
            ->orderBy('status')
            ->orderBy('id')
            ->get();

        return SlaConfigResource::collection($configs);
    }

    public function store(StoreSlaConfigRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;

        $config = SlaConfig::query()->create($data);

        return (new SlaConfigResource($config))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateSlaConfigRequest $request, SlaConfig $slaConfig): SlaConfigResource
    {
        $slaConfig->update($request->validated());

        return new SlaConfigResource($slaConfig->fresh());
    }

    public function destroy(SlaConfig $slaConfig): JsonResponse
    {
        $slaConfig->delete();

        return response()->json([], 204);
    }
}
