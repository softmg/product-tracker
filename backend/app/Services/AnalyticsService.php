<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Hypothesis;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * @return array<int, array{status: string, count: int}>
     */
    public function getStatusDistribution(): array
    {
        return Hypothesis::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(static function (Hypothesis $row): array {
                $status = $row->getAttribute('status');

                return [
                    'status' => $status instanceof \BackedEnum ? $status->value : (string) $status,
                    'count' => (int) $row->getAttribute('count'),
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array{user_id: int, name: string, count: int}>
     */
    public function getInitiatorStats(): array
    {
        return Hypothesis::query()
            ->selectRaw('initiator_id as user_id, users.name as name, COUNT(*) as count')
            ->join('users', 'users.id', '=', 'hypotheses.initiator_id')
            ->groupBy('initiator_id', 'users.name')
            ->orderByDesc('count')
            ->orderBy('users.name')
            ->get()
            ->map(static fn (Hypothesis $row): array => [
                'user_id' => (int) $row->getAttribute('user_id'),
                'name' => (string) $row->getAttribute('name'),
                'count' => (int) $row->getAttribute('count'),
            ])
            ->all();
    }

    /**
     * @return array<int, array{team_id: int, name: string, count: int}>
     */
    public function getTeamStats(): array
    {
        return Hypothesis::query()
            ->selectRaw('team_id, teams.name as name, COUNT(*) as count')
            ->join('teams', 'teams.id', '=', 'hypotheses.team_id')
            ->groupBy('team_id', 'teams.name')
            ->orderByDesc('count')
            ->orderBy('teams.name')
            ->get()
            ->map(static fn (Hypothesis $row): array => [
                'team_id' => (int) $row->getAttribute('team_id'),
                'name' => (string) $row->getAttribute('name'),
                'count' => (int) $row->getAttribute('count'),
            ])
            ->all();
    }

    /**
     * @return array<int, array{month: string, count: int}>
     */
    public function getTimelineStats(?Carbon $from = null, ?Carbon $to = null): array
    {
        $query = Hypothesis::query();

        if ($from !== null) {
            $query->where('created_at', '>=', $from);
        }

        if ($to !== null) {
            $query->where('created_at', '<=', $to);
        }

        return $query
            ->selectRaw("to_char(created_at, 'YYYY-MM') as month, COUNT(*) as count")
            ->groupByRaw("to_char(created_at, 'YYYY-MM')")
            ->orderByRaw("to_char(created_at, 'YYYY-MM')")
            ->get()
            ->map(static fn (Hypothesis $row): array => [
                'month' => (string) $row->getAttribute('month'),
                'count' => (int) $row->getAttribute('count'),
            ])
            ->all();
    }

    /**
     * @return array<int, array{status: string, average_primary_score: float}>
     */
    public function getAverageScoringByStatus(): array
    {
        return Hypothesis::query()
            ->selectRaw('status, AVG(scoring_primary) as average_primary_score')
            ->whereNotNull('scoring_primary')
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(static function (Hypothesis $row): array {
                $status = $row->getAttribute('status');

                return [
                    'status' => $status instanceof \BackedEnum ? $status->value : (string) $status,
                    'average_primary_score' => round((float) $row->getAttribute('average_primary_score'), 2),
                ];
            })
            ->all();
    }
}
