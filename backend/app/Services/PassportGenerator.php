<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Hypothesis;
use Barryvdh\DomPDF\Facade\Pdf as PdfFacade;
use Barryvdh\DomPDF\PDF;

class PassportGenerator
{
    public function generate(Hypothesis $hypothesis): PDF
    {
        $hypothesis->load([
            'initiator',
            'owner',
            'team',
            'scorings.scoredBy',
            'deepDives.stage',
            'experiments.metrics',
            'respondents.pains',
            'files.uploadedBy',
        ]);

        return PdfFacade::loadView('exports.passport', [
            'hypothesis' => $hypothesis,
        ]);
    }
}
