<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\CommitteeDecisionFinalized;
use App\Events\HypothesisStatusChanged;
use App\Events\SlaViolation;
use App\Events\SlaWarning;
use App\Listeners\LogHypothesisStatusChange;
use App\Listeners\NotifyOnCommitteeDecision;
use App\Listeners\NotifyOnSlaViolation;
use App\Listeners\NotifyOnStatusChange;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        HypothesisStatusChanged::class => [
            LogHypothesisStatusChange::class,
            NotifyOnStatusChange::class,
        ],
        SlaWarning::class => [
            NotifyOnSlaViolation::class,
        ],
        SlaViolation::class => [
            NotifyOnSlaViolation::class,
        ],
        CommitteeDecisionFinalized::class => [
            NotifyOnCommitteeDecision::class,
        ],
    ];
}
