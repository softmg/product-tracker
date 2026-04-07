<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScoringResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hypothesis_id' => $this->hypothesis_id,
            'stage' => $this->stage,
            'criteria_scores' => $this->criteria_scores,
            'total_score' => $this->total_score,
            'stop_factor_triggered' => $this->stop_factor_triggered,
            'scored_by' => $this->scored_by,
            'scored_by_user' => new UserResource($this->whenLoaded('scoredBy')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
