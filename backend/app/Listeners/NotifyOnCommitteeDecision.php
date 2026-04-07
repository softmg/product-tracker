<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\CommitteeDecisionFinalized;
use App\Services\NotificationDispatcher;

class NotifyOnCommitteeDecision
{
    public function __construct(private readonly NotificationDispatcher $notificationDispatcher)
    {
    }

    public function handle(CommitteeDecisionFinalized $event): void
    {
        $this->notificationDispatcher->dispatch(
            eventType: 'committee_decision',
            hypothesis: $event->hypothesis,
            context: [
                'decision' => $event->decision,
                'total_votes' => $event->totalVotes,
                'winning_votes' => $event->winningVotes,
            ],
        );
    }
}
