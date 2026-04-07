<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ScoringCriterion;

class ScoringCalculator
{
    /**
     * Calculate weighted score from criteria scores.
     *
     * @param array<int|string, int|float|string> $criteriaScores
     * @return array{total_score: float, stop_factor_triggered: bool}
     */
    public function calculate(array $criteriaScores, string $stage): array
    {
        $criteria = ScoringCriterion::query()
            ->where('stage', $stage)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $stopFactorTriggered = false;
        $weightedSum = 0.0;
        $totalWeight = 0.0;

        foreach ($criteriaScores as $criterionId => $rawScore) {
            $criterion = $criteria->get((int) $criterionId);

            if (! $criterion) {
                continue;
            }

            $score = (float) $rawScore;

            if ($criterion->is_stop_factor) {
                if ($score > 0) {
                    $stopFactorTriggered = true;
                }

                continue;
            }

            $normalizedScore = $this->normalize($score, $criterion);
            $weight = (float) $criterion->weight;

            $weightedSum += $normalizedScore * $weight;
            $totalWeight += $weight;
        }

        $totalScore = $totalWeight > 0
            ? round($weightedSum / $totalWeight, 2)
            : 0.0;

        return [
            'total_score' => $totalScore,
            'stop_factor_triggered' => $stopFactorTriggered,
        ];
    }

    private function normalize(float $rawScore, ScoringCriterion $criterion): float
    {
        if ($criterion->input_type === 'number' && is_array($criterion->thresholds) && $criterion->thresholds !== []) {
            $thresholds = collect($criterion->thresholds)
                ->filter(static fn (mixed $value): bool => is_numeric($value))
                ->map(static fn (mixed $value): float => (float) $value)
                ->sort()
                ->values();

            if ($thresholds->isNotEmpty()) {
                $level = 1.0;

                foreach ($thresholds as $threshold) {
                    if ($rawScore >= $threshold) {
                        $level++;
                    }
                }

                return min($level, 5.0);
            }
        }

        return max(1.0, min(5.0, $rawScore));
    }
}
