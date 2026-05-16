<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->getAttributes();

        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'role' => $this->role->value,
            'roles' => $this->roleValues(),
            'team_id' => $this->team_id,
            'team' => $this->whenLoaded('team', fn (): array => [
                'id' => $this->team->id,
                'name' => $this->team->name,
            ]),
            'is_active' => $this->is_active,
            'sso_provider' => array_key_exists('sso_provider', $attributes) ? $this->sso_provider : null,
            'sso_subject' => array_key_exists('sso_subject', $attributes) ? $this->sso_subject : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'sso_last_login_at' => array_key_exists('sso_last_login_at', $attributes)
                ? $this->sso_last_login_at?->toIso8601String()
                : null,
        ];
    }
}
