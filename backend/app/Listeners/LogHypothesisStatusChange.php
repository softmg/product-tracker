<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\HypothesisStatusChanged;
use App\Models\AuditLog;
use App\Services\AuditLogger;

class LogHypothesisStatusChange
{
    public function __construct(private readonly AuditLogger $auditLogger)
    {
    }

    public function handle(HypothesisStatusChanged $event): void
    {
        $this->auditLogger->log(
            entityType: AuditLog::ENTITY_TYPE_HYPOTHESIS,
            entityId: $event->hypothesis->id,
            action: AuditLog::ACTION_STATUS_CHANGE,
            changes: [
                'from_status' => $event->fromStatus->value,
                'to_status' => $event->toStatus->value,
            ],
            userId: $event->changedBy->id,
        );
    }
}
