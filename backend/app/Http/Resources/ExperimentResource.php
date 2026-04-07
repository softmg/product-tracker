<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExperimentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'type' => $this->type,
            'status' => $this->status,
            'description' => $this->description,
            'what_worked' => $this->what_worked,
            'what_not_worked' => $this->what_not_worked,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'result' => $this->result,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'responsible_user_id' => $this->responsible_user_id,
            'metrics' => ExperimentMetricResource::collection($this->whenLoaded('metrics')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
