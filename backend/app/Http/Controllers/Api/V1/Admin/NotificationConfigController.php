<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNotificationEventRequest;
use App\Http\Requests\Admin\UpdateNotificationEventRequest;
use App\Http\Resources\NotificationEventResource;
use App\Models\NotificationEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationConfigController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $events = NotificationEvent::query()
            ->orderBy('event_type')
            ->orderBy('id')
            ->get();

        return NotificationEventResource::collection($events);
    }

    public function store(StoreNotificationEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;
        $data['channel'] = $data['channel'] ?? 'in_app';

        $event = NotificationEvent::query()->create($data);

        return (new NotificationEventResource($event))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateNotificationEventRequest $request, NotificationEvent $notificationEvent): NotificationEventResource
    {
        $notificationEvent->update($request->validated());

        return new NotificationEventResource($notificationEvent->fresh());
    }

    public function destroy(NotificationEvent $notificationEvent): JsonResponse
    {
        $notificationEvent->delete();

        return response()->json([], 204);
    }
}
