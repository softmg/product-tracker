<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;

class AuditLogger
{
    /**
     * @param array<string, mixed> $changes
     */
    public function log(string $entityType, int $entityId, string $action, array $changes = [], ?int $userId = null): void
    {
        AuditLog::query()->create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'changes' => $changes,
            'user_id' => $userId ?? auth()->id(),
        ]);
    }
}
