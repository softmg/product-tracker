<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HypothesisListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'status' => $this->status->value,
            'priority' => $this->priority?->value,
            'initiator' => $this->whenLoaded('initiator', fn (): array => [
                'id' => $this->initiator->id,
                'name' => $this->initiator->name,
            ]),
            'owner' => $this->whenLoaded('owner', fn (): ?array => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null),
            'team' => $this->whenLoaded('team', fn (): ?array => $this->team ? [
                'id' => $this->team->id,
                'name' => $this->team->name,
            ] : null),
            'scoring_primary' => $this->scoring_primary,
            'scoring_deep' => $this->scoring_deep,
            'sla_deadline' => $this->sla_deadline?->toIso8601String(),
            'sla_status' => $this->sla_status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
