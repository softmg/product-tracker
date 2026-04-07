<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\HypothesisStatus;
use App\Events\CommitteeDecisionFinalized;
use App\Models\CommitteeVote;
use App\Models\Hypothesis;
use App\Models\User;
use DomainException;

class CommitteeDecisionService
{
    public function __construct(private readonly StatusMachineService $statusMachineService)
    {
    }

    /**
     * @return array{hypothesis: Hypothesis, decision: string, total_votes: int, winning_votes: int}
     */
    public function finalize(Hypothesis $hypothesis, User $actor): array
    {
        $votes = CommitteeVote::query()
            ->where('hypothesis_id', $hypothesis->id)
            ->whereHas('member', static function ($query): void {
                $query->where('is_active', true);
            })
            ->get();

        if ($votes->isEmpty()) {
            throw new DomainException('No votes available for finalization.');
        }

        $totalVotes = $votes->count();
        $majorityThreshold = $totalVotes / 2;

        $voteCounts = $votes
            ->groupBy('vote')
            ->map(static fn ($group): int => $group->count());

        $decision = null;
        $winningVotes = 0;

        foreach (['go', 'no_go', 'iterate'] as $candidate) {
            $count = (int) ($voteCounts[$candidate] ?? 0);

            if ($count > $majorityThreshold) {
                $decision = $candidate;
                $winningVotes = $count;
                break;
            }
        }

        if ($decision === null) {
            throw new DomainException('Cannot finalize decision without a majority.');
        }

        $toStatus = $this->statusForDecision($decision);

        $comment = sprintf('Committee decision: %s (%d/%d votes)', $decision, $winningVotes, $totalVotes);

        $updatedHypothesis = $this->statusMachineService->transition(
            $hypothesis,
            $toStatus,
            $actor,
            $comment,
        );

        event(new CommitteeDecisionFinalized(
            $updatedHypothesis,
            $decision,
            $totalVotes,
            $winningVotes,
            $actor,
        ));

        return [
            'hypothesis' => $updatedHypothesis,
            'decision' => $decision,
            'total_votes' => $totalVotes,
            'winning_votes' => $winningVotes,
        ];
    }

    private function statusForDecision(string $decision): HypothesisStatus
    {
        return match ($decision) {
            'go' => HypothesisStatus::Done,
            'no_go' => HypothesisStatus::Archived,
            'iterate' => HypothesisStatus::Experiment,
            default => throw new DomainException('Unsupported decision value.'),
        };
    }
}
