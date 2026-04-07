<?php

declare(strict_types=1);

namespace App\Events;

use App\Enums\HypothesisStatus;
use App\Models\Hypothesis;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class HypothesisStatusChanged
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Hypothesis $hypothesis,
        public readonly HypothesisStatus $fromStatus,
        public readonly HypothesisStatus $toStatus,
        public readonly User $changedBy,
    ) {
    }
}
