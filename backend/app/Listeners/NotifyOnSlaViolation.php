<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\SlaViolation;
use App\Events\SlaWarning;
use App\Services\NotificationDispatcher;
use Carbon\CarbonInterface;

class NotifyOnSlaViolation
{
    public function __construct(private readonly NotificationDispatcher $notificationDispatcher)
    {
    }

    public function handle(SlaWarning|SlaViolation $event): void
    {
        $hypothesis = $event->hypothesis;

        $context = [
            'days_left' => 0,
            'days_overdue' => 0,
        ];

        if ($hypothesis->sla_deadline instanceof CarbonInterface) {
            $context['days_left'] = max(
                0,
                now()->startOfDay()->diffInDays($hypothesis->sla_deadline->copy()->startOfDay(), false),
            );

            $context['days_overdue'] = max(
                0,
                $hypothesis->sla_deadline->copy()->startOfDay()->diffInDays(now()->startOfDay(), false),
            );
        }

        $eventType = $event instanceof SlaViolation ? 'sla_violation' : 'sla_warning';

        $this->notificationDispatcher->dispatch(
            eventType: $eventType,
            hypothesis: $hypothesis,
            context: $context,
        );
    }
}
