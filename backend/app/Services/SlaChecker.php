<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\HypothesisStatus;
use App\Events\SlaViolation;
use App\Events\SlaWarning;
use App\Models\Hypothesis;
use App\Models\SlaConfig;
use Carbon\CarbonInterface;

class SlaChecker
{
    /**
     * @return array{warnings: int, violations: int}
     */
    public function check(): array
    {
        $warnings = 0;
        $violations = 0;

        $hypotheses = Hypothesis::query()
            ->whereNotNull('sla_deadline')
            ->whereNotIn('status', [HypothesisStatus::Done, HypothesisStatus::Archived])
            ->get();

        foreach ($hypotheses as $hypothesis) {
            $slaConfig = SlaConfig::query()
                ->where('status', $hypothesis->status)
                ->where('is_active', true)
                ->first();

            if (! $slaConfig) {
                continue;
            }

            $deadline = $hypothesis->sla_deadline;

            if (! $deadline instanceof CarbonInterface) {
                continue;
            }

            $warningDate = $deadline->copy()->subDays($slaConfig->warning_days);

            if (now()->gte($deadline) && $hypothesis->sla_status !== 'violated') {
                $hypothesis->update(['sla_status' => 'violated']);
                $violations++;
                event(new SlaViolation($hypothesis->fresh()));
                continue;
            }

            if (now()->gte($warningDate) && now()->lt($deadline) && $hypothesis->sla_status !== 'warning') {
                $hypothesis->update(['sla_status' => 'warning']);
                $warnings++;
                event(new SlaWarning($hypothesis->fresh()));
            }
        }

        return [
            'warnings' => $warnings,
            'violations' => $violations,
        ];
    }
}
