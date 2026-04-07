<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HypothesisResource extends JsonResource
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
            'description' => $this->description,
            'problem' => $this->problem,
            'solution' => $this->solution,
            'assumptions' => $this->assumptions,
            'target_audience' => $this->target_audience,
            'status' => $this->status->value,
            'priority' => $this->priority?->value,
            'initiator_id' => $this->initiator_id,
            'owner_id' => $this->owner_id,
            'team_id' => $this->team_id,
            'scoring_primary' => $this->scoring_primary,
            'scoring_deep' => $this->scoring_deep,
            'sla_deadline' => $this->sla_deadline?->toIso8601String(),
            'sla_status' => $this->sla_status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'initiator' => new UserResource($this->whenLoaded('initiator')),
            'owner' => new UserResource($this->whenLoaded('owner')),
            'team' => new TeamResource($this->whenLoaded('team')),
            'scorings' => HypothesisScoringResource::collection($this->whenLoaded('scorings')),
            'deep_dives' => HypothesisDeepDiveResource::collection($this->whenLoaded('deepDives')),
            'experiments' => ExperimentResource::collection($this->whenLoaded('experiments')),
            'committee_votes' => CommitteeVoteResource::collection($this->whenLoaded('committeeVotes')),
            'status_history' => HypothesisStatusHistoryResource::collection($this->whenLoaded('statusHistory')),
        ];
    }
}
