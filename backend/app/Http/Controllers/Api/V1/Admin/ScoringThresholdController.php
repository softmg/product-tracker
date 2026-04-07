<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateScoringThresholdRequest;
use App\Http\Resources\ScoringThresholdConfigResource;
use App\Models\ScoringThresholdConfig;

class ScoringThresholdController extends Controller
{
    public function show(): ScoringThresholdConfigResource
    {
        $config = ScoringThresholdConfig::query()->first();

        if ($config === null) {
            $config = ScoringThresholdConfig::query()->create([
                'primary_threshold' => 7.00,
                'deep_threshold' => 7.00,
            ]);
        }

        return new ScoringThresholdConfigResource($config);
    }

    public function update(UpdateScoringThresholdRequest $request): ScoringThresholdConfigResource
    {
        $config = ScoringThresholdConfig::query()->first();

        if ($config === null) {
            $config = ScoringThresholdConfig::query()->create([
                'primary_threshold' => 7.00,
                'deep_threshold' => 7.00,
            ]);
        }

        $config->update($request->validated());

        return new ScoringThresholdConfigResource($config->fresh());
    }
}
