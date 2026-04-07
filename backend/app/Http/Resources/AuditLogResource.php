<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * @var array<int, string>
     */
    private const REDACTED_CHANGE_KEYS = [
        'password',
        'remember_token',
        'token',
        'secret',
        'api_key',
    ];

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'action' => $this->action,
            'changes' => $this->sanitizeChanges($this->changes),
            'user_id' => $this->user_id,
            'user' => $this->when(
                $this->relationLoaded('user'),
                $this->user === null
                    ? null
                    : [
                        'id' => $this->user->id,
                        'name' => $this->user->name,
                    ],
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @param mixed $changes
     * @return mixed
     */
    private function sanitizeChanges(mixed $changes): mixed
    {
        if (! is_array($changes)) {
            return $changes;
        }

        $sanitized = [];

        foreach ($changes as $key => $value) {
            if (is_string($key) && $this->shouldRedactKey($key)) {
                $sanitized[$key] = '[REDACTED]';
                continue;
            }

            $sanitized[$key] = $this->sanitizeChanges($value);
        }

        return $sanitized;
    }

    private function shouldRedactKey(string $key): bool
    {
        $normalized = strtolower($key);

        foreach (self::REDACTED_CHANGE_KEYS as $sensitiveKey) {
            if (str_contains($normalized, $sensitiveKey)) {
                return true;
            }
        }

        return false;
    }
}
