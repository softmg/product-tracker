<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\AuditLog;
use App\Models\Hypothesis;
use App\Services\AuditLogger;

class HypothesisObserver
{
    public function __construct(private readonly AuditLogger $auditLogger)
    {
    }

    public function created(Hypothesis $hypothesis): void
    {
        $this->auditLogger->log(
            entityType: AuditLog::ENTITY_TYPE_HYPOTHESIS,
            entityId: $hypothesis->id,
            action: AuditLog::ACTION_CREATE,
            changes: [
                'after' => $this->extractAttributes($hypothesis),
            ],
            userId: auth()->id(),
        );
    }

    public function updated(Hypothesis $hypothesis): void
    {
        $changes = $hypothesis->getChanges();

        unset($changes['updated_at']);

        if ($changes === []) {
            return;
        }

        $before = [];
        foreach (array_keys($changes) as $key) {
            $before[$key] = $hypothesis->getOriginal($key);
        }

        $this->auditLogger->log(
            entityType: AuditLog::ENTITY_TYPE_HYPOTHESIS,
            entityId: $hypothesis->id,
            action: AuditLog::ACTION_UPDATE,
            changes: [
                'before' => $before,
                'after' => $changes,
            ],
            userId: auth()->id(),
        );
    }

    public function deleted(Hypothesis $hypothesis): void
    {
        $this->auditLogger->log(
            entityType: AuditLog::ENTITY_TYPE_HYPOTHESIS,
            entityId: $hypothesis->id,
            action: AuditLog::ACTION_DELETE,
            changes: [
                'before' => $this->extractAttributes($hypothesis),
            ],
            userId: auth()->id(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function extractAttributes(Hypothesis $hypothesis): array
    {
        $attributes = $hypothesis->getAttributes();
        unset($attributes['updated_at']);

        return $attributes;
    }
}
