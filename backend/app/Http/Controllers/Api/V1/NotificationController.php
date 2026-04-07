<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $query = Notification::query()->where('user_id', $user->id);

        $isRead = $request->query('is_read');
        if ($isRead !== null && $isRead !== '') {
            $parsed = filter_var($isRead, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);

            if ($parsed !== null) {
                $query->where('is_read', $parsed);
            }
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        return NotificationResource::collection(
            $query
                ->orderByDesc('id')
                ->paginate($perPage)
                ->withQueryString(),
        );
    }

    public function markRead(Request $request, int $notification): NotificationResource
    {
        /** @var User $user */
        $user = $request->user();

        $model = Notification::query()
            ->where('id', $notification)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if (! $model->is_read) {
            $model->update([
                'is_read' => true,
            ]);
        }

        return new NotificationResource($model->fresh());
    }

    public function markAllRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $updated = Notification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'updated_at' => now(),
            ]);

        return response()->json([
            'meta' => [
                'updated' => $updated,
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $count = Notification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'count' => $count,
        ]);
    }
}
