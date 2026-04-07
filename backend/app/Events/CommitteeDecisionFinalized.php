<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Hypothesis;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommitteeDecisionFinalized
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Hypothesis $hypothesis,
        public readonly string $decision,
        public readonly int $totalVotes,
        public readonly int $winningVotes,
        public readonly User $actor,
    ) {
    }
}
