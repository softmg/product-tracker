<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListAuditLogRequest;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Models\Hypothesis;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function index(ListAuditLogRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $query = AuditLog::query()->with('user');

        if (isset($validated['entity_type'])) {
            $query->where('entity_type', $validated['entity_type']);
        }

        if (isset($validated['entity_id'])) {
            $query->where('entity_id', $validated['entity_id']);
        }

        if (isset($validated['action'])) {
            $query->where('action', $validated['action']);
        }

        if (isset($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (isset($validated['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($validated['date_from'])->startOfDay());
        }

        if (isset($validated['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($validated['date_to'])->endOfDay());
        }

        $perPage = (int) ($validated['per_page'] ?? 15);

        return AuditLogResource::collection(
            $query
                ->orderByDesc('id')
                ->paginate($perPage)
                ->withQueryString(),
        );
    }

    public function hypothesisHistory(Request $request, Hypothesis $hypothesis): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 15);

        return AuditLogResource::collection(
            AuditLog::query()
                ->with('user')
                ->where('entity_type', AuditLog::ENTITY_TYPE_HYPOTHESIS)
                ->where('entity_id', $hypothesis->id)
                ->orderByDesc('id')
                ->paginate($perPage)
                ->withQueryString(),
        );
    }
}
