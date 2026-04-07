<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AnalyticsController extends Controller
{
    public function __construct(private readonly AnalyticsService $analyticsService)
    {
    }

    public function statusDistribution(): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getStatusDistribution(),
        ]);
    }

    public function initiatorStats(): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getInitiatorStats(),
        ]);
    }

    public function teamStats(): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->getTeamStats(),
        ]);
    }

    public function timeline(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from']) ? Carbon::parse((string) $validated['from'])->startOfDay() : null;
        $to = isset($validated['to']) ? Carbon::parse((string) $validated['to'])->endOfDay() : null;

        return response()->json([
            'data' => $this->analyticsService->getTimelineStats($from, $to),
        ]);
    }

    public function export(): BinaryFileResponse
    {
        $rows = $this->buildExportRows();

        return Excel::download(
            new class($rows) implements FromArray
            {
                /**
                 * @param array<int, array<int, string|int|float>> $rows
                 */
                public function __construct(private readonly array $rows)
                {
                }

                /**
                 * @return array<int, array<int, string|int|float>>
                 */
                public function array(): array
                {
                    return $this->rows;
                }
            },
            'analytics.xlsx',
        );
    }

    /**
     * @return array<int, array<int, string|int|float>>
     */
    private function buildExportRows(): array
    {
        $rows = [
            ['Section', 'Field', 'Value'],
            ['Status distribution', 'Status', 'Count'],
        ];

        foreach ($this->analyticsService->getStatusDistribution() as $row) {
            $rows[] = ['Status distribution', $row['status'], $row['count']];
        }

        $rows[] = ['', '', ''];
        $rows[] = ['Initiator stats', 'Name', 'Count'];

        foreach ($this->analyticsService->getInitiatorStats() as $row) {
            $rows[] = ['Initiator stats', $row['name'], $row['count']];
        }

        $rows[] = ['', '', ''];
        $rows[] = ['Team stats', 'Name', 'Count'];

        foreach ($this->analyticsService->getTeamStats() as $row) {
            $rows[] = ['Team stats', $row['name'], $row['count']];
        }

        $rows[] = ['', '', ''];
        $rows[] = ['Timeline', 'Month', 'Count'];

        foreach ($this->analyticsService->getTimelineStats() as $row) {
            $rows[] = ['Timeline', $row['month'], $row['count']];
        }

        $rows[] = ['', '', ''];
        $rows[] = ['Average scoring by status', 'Status', 'Average primary score'];

        foreach ($this->analyticsService->getAverageScoringByStatus() as $row) {
            $rows[] = ['Average scoring by status', $row['status'], $row['average_primary_score']];
        }

        return $rows;
    }
}
