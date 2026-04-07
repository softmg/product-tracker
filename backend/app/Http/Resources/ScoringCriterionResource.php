<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScoringCriterionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'input_type' => $this->input_type,
            'min_value' => $this->min_value,
            'max_value' => $this->max_value,
            'weight' => $this->weight,
            'is_active' => $this->is_active,
            'thresholds' => $this->thresholds,
            'is_stop_factor' => $this->is_stop_factor,
            'stage' => $this->stage,
            'order' => $this->order,
        ];
    }
}
