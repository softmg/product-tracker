<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\Hypothesis;
use Maatwebsite\Excel\Concerns\FromArray;

class HypothesisExport implements FromArray
{
    public function __construct(private readonly Hypothesis $hypothesis)
    {
    }

    /**
     * @return array<int, array<int, string|int|float|null>>
     */
    public function array(): array
    {
        $hypothesis = $this->hypothesis->load([
            'initiator',
            'owner',
            'team',
            'scorings',
            'deepDives.stage',
            'experiments',
            'respondents',
        ]);

        $rows = [
            ['Section', 'Field', 'Value'],
            ['General', 'ID', $hypothesis->id],
            ['General', 'Code', $hypothesis->code],
            ['General', 'Title', $hypothesis->title],
            ['General', 'Status', $hypothesis->status->value],
            ['General', 'Priority', $hypothesis->priority?->value],
            ['General', 'Initiator', $hypothesis->initiator?->name],
            ['General', 'Owner', $hypothesis->owner?->name],
            ['General', 'Team', $hypothesis->team?->name],
            ['General', 'Primary score', $hypothesis->scoring_primary],
            ['General', 'Deep score', $hypothesis->scoring_deep],
            ['General', 'SLA status', $hypothesis->sla_status],
            ['', '', ''],
            ['Scoring', 'Stage', 'Total score'],
        ];

        foreach ($hypothesis->scorings as $scoring) {
            $rows[] = ['Scoring', $scoring->stage, $scoring->total_score];
        }

        $rows[] = ['', '', ''];
        $rows[] = ['Deep Dive', 'Stage', 'Completed'];

        foreach ($hypothesis->deepDives as $deepDive) {
            $rows[] = [
                'Deep Dive',
                $deepDive->stage?->name,
                $deepDive->is_completed ? 'yes' : 'no',
            ];
        }

        $rows[] = ['', '', ''];
        $rows[] = ['Experiments', 'Title', 'Result'];

        foreach ($hypothesis->experiments as $experiment) {
            $rows[] = [
                'Experiments',
                $experiment->title,
                $experiment->result,
            ];
        }

        $rows[] = ['', '', ''];
        $rows[] = ['Respondents', 'Name', 'Status'];

        foreach ($hypothesis->respondents as $respondent) {
            $rows[] = [
                'Respondents',
                $respondent->name,
                $respondent->status,
            ];
        }

        return $rows;
    }
}
