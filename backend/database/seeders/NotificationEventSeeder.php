<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\NotificationEvent;
use Illuminate\Database\Seeder;

class NotificationEventSeeder extends Seeder
{
    public function run(): void
    {
        $events = [
            [
                'event_type' => 'status_change',
                'is_active' => true,
                'recipients' => ['owner', 'initiator'],
                'template' => 'Hypothesis {hyp_id} moved to {new_status}',
                'channel' => 'in_app',
            ],
            [
                'event_type' => 'responsible_assigned',
                'is_active' => true,
                'recipients' => ['owner'],
                'template' => 'You were assigned to hypothesis {hyp_id}',
                'channel' => 'in_app',
            ],
            [
                'event_type' => 'committee_decision',
                'is_active' => true,
                'recipients' => ['owner', 'initiator', 'committee'],
                'template' => 'Committee made decision for {hyp_id}: {decision}',
                'channel' => 'in_app',
            ],
            [
                'event_type' => 'sla_warning',
                'is_active' => true,
                'recipients' => ['owner', 'initiator'],
                'template' => 'SLA warning for {hyp_id}: {days_left} days left',
                'channel' => 'in_app',
            ],
            [
                'event_type' => 'sla_violation',
                'is_active' => true,
                'recipients' => ['owner', 'initiator', 'admin'],
                'template' => 'SLA violation for {hyp_id}: overdue by {days_overdue} days',
                'channel' => 'in_app',
            ],
            [
                'event_type' => 'committee_voting_opened',
                'is_active' => true,
                'recipients' => ['committee', 'admin'],
                'template' => 'Committee voting opened for hypothesis {hyp_id}',
                'channel' => 'in_app',
            ],
        ];

        foreach ($events as $event) {
            NotificationEvent::query()->updateOrCreate(
                ['event_type' => $event['event_type']],
                [
                    'is_active' => $event['is_active'],
                    'recipients' => $event['recipients'],
                    'template' => $event['template'],
                    'channel' => $event['channel'],
                ],
            );
        }
    }
}
