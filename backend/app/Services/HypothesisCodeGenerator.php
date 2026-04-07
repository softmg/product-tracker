<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Hypothesis;

class HypothesisCodeGenerator
{
    public function generate(): string
    {
        $lastCode = Hypothesis::query()
            ->orderByDesc('id')
            ->value('code');

        $nextNumber = $lastCode
            ? (int) str_replace('HYP-', '', $lastCode) + 1
            : 1;

        return sprintf('HYP-%03d', $nextNumber);
    }
}
