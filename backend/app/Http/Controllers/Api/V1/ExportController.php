<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Exports\HypothesisExport;
use App\Http\Controllers\Controller;
use App\Models\Hypothesis;
use App\Services\PassportGenerator;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class ExportController extends Controller
{
    public function __construct(private readonly PassportGenerator $passportGenerator)
    {
    }

    public function pdf(Request $request, Hypothesis $hypothesis): Response
    {
        $pdf = $this->passportGenerator->generate($hypothesis);

        return $pdf->download(sprintf('hypothesis-%s-passport.pdf', $hypothesis->code));
    }

    public function excel(Request $request, Hypothesis $hypothesis): BinaryFileResponse
    {
        return Excel::download(
            new HypothesisExport($hypothesis),
            sprintf('hypothesis-%s.xlsx', $hypothesis->code),
        );
    }
}
