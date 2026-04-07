<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RespondentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hypothesis_id' => $this->hypothesis_id,
            'name' => $this->name,
            'company' => $this->company,
            'position' => $this->position,
            'email' => $this->email,
            'phone' => $this->phone,
            'contact_source' => $this->contact_source,
            'status' => $this->status,
            'interview_date' => $this->interview_date?->toIso8601String(),
            'interview_duration' => $this->interview_duration,
            'interviewer_user_id' => $this->interviewer_user_id,
            'interview_format' => $this->interview_format,
            'recording_url' => $this->recording_url,
            'pains_count' => $this->when(isset($this->pains_count), $this->pains_count),
            'pains' => RespondentPainResource::collection($this->whenLoaded('pains')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
