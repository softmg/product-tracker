<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\AuditLog;
use App\Models\Experiment;
use App\Services\AuditLogger;

class ExperimentObserver
{
    public function __construct(private readonly AuditLogger $auditLogger)
    {
    }

    public function created(Experiment $experiment): void
    {
        $this->auditLogger->log(
            entityType: AuditLog::ENTITY_TYPE_EXPERIMENT,
            entityId: $experiment->id,
            action: AuditLog::ACTION_CREATE,
            changes: [
                'after' => $this->extractAttributes($experiment),
            ],
            userId: auth()->id(),
        );
    }

    public function updated(Experiment $experiment): void
    {
        $changes = $experiment->getChanges();

        unset($changes['updated_at']);

        if ($changes === []) {
            return;
        }

        $before = [];
        foreach (array_keys($changes) as $key) {
            $before[$key] = $experiment->getOriginal($key);
        }

        $this->auditLogger->log(
            entityType: AuditLog::ENTITY_TYPE_EXPERIMENT,
            entityId: $experiment->id,
            action: AuditLog::ACTION_UPDATE,
            changes: [
                'before' => $before,
                'after' => $changes,
            ],
            userId: auth()->id(),
        );
    }

    public function deleted(Experiment $experiment): void
    {
        $this->auditLogger->log(
            entityType: AuditLog::ENTITY_TYPE_EXPERIMENT,
            entityId: $experiment->id,
            action: AuditLog::ACTION_DELETE,
            changes: [
                'before' => $this->extractAttributes($experiment),
            ],
            userId: auth()->id(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function extractAttributes(Experiment $experiment): array
    {
        $attributes = $experiment->getAttributes();
        unset($attributes['updated_at']);

        return $attributes;
    }
}
