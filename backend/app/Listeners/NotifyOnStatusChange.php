<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\HypothesisStatusChanged;
use App\Services\NotificationDispatcher;

class NotifyOnStatusChange
{
    public function __construct(private readonly NotificationDispatcher $notificationDispatcher)
    {
    }

    public function handle(HypothesisStatusChanged $event): void
    {
        $this->notificationDispatcher->dispatch(
            eventType: 'status_change',
            hypothesis: $event->hypothesis,
            context: [
                'old_status' => $event->fromStatus->value,
                'new_status' => $event->toStatus->value,
            ],
        );
    }
}
