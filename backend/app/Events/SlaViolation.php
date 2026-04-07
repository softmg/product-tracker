<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Hypothesis;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SlaViolation
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public readonly Hypothesis $hypothesis)
    {
    }
}
