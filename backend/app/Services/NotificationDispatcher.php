<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Jobs\SendTelegramNotification;
use App\Models\CommitteeMember;
use App\Models\Hypothesis;
use App\Models\Notification;
use App\Models\NotificationEvent;
use App\Models\User;
use BackedEnum;

class NotificationDispatcher
{
    /**
     * @param array<string, mixed> $context
     */
    public function dispatch(string $eventType, Hypothesis $hypothesis, array $context = []): void
    {
        $eventConfig = NotificationEvent::query()
            ->where('event_type', $eventType)
            ->where('is_active', true)
            ->first();

        if (! $eventConfig) {
            return;
        }

        $recipientIds = $this->resolveRecipientIds($eventConfig->recipients ?? [], $hypothesis);

        if ($recipientIds === []) {
            return;
        }

        $message = $this->renderMessage($eventConfig->template, $eventType, $hypothesis, $context);

        foreach ($recipientIds as $recipientId) {
            Notification::query()->create([
                'user_id' => $recipientId,
                'hypothesis_id' => $hypothesis->id,
                'type' => $eventType,
                'message' => $message,
                'is_read' => false,
            ]);
        }

        if ($this->telegramEnabled($eventConfig->channel)) {
            SendTelegramNotification::dispatch(
                chatId: (string) config('services.telegram.chat_id', ''),
                message: $message,
            );
        }
    }

    /**
     * @param array<int, mixed> $recipients
     * @return array<int, int>
     */
    private function resolveRecipientIds(array $recipients, Hypothesis $hypothesis): array
    {
        $recipientIds = [];

        foreach ($recipients as $recipient) {
            if (is_int($recipient)) {
                $recipientIds[] = $recipient;

                continue;
            }

            if (! is_string($recipient) || $recipient === '') {
                continue;
            }

            if (ctype_digit($recipient)) {
                $recipientIds[] = (int) $recipient;

                continue;
            }

            if ($recipient === 'owner' && $hypothesis->owner_id !== null) {
                $recipientIds[] = (int) $hypothesis->owner_id;

                continue;
            }

            if ($recipient === 'initiator') {
                $recipientIds[] = (int) $hypothesis->initiator_id;

                continue;
            }

            if ($recipient === 'committee') {
                $committeeIds = CommitteeMember::query()
                    ->where('is_active', true)
                    ->pluck('user_id')
                    ->map(static fn ($id): int => (int) $id)
                    ->all();

                $recipientIds = [...$recipientIds, ...$committeeIds];

                continue;
            }

            if ($recipient === 'admin') {
                $adminIds = User::query()
                    ->where('role', UserRole::Admin->value)
                    ->where('is_active', true)
                    ->pluck('id')
                    ->map(static fn ($id): int => (int) $id)
                    ->all();

                $recipientIds = [...$recipientIds, ...$adminIds];

                continue;
            }

            if ($this->isUserRoleValue($recipient)) {
                $roleIds = User::query()
                    ->where('role', $recipient)
                    ->where('is_active', true)
                    ->pluck('id')
                    ->map(static fn ($id): int => (int) $id)
                    ->all();

                $recipientIds = [...$recipientIds, ...$roleIds];
            }
        }

        $recipientIds = array_values(array_unique(array_filter(
            $recipientIds,
            static fn (int $id): bool => $id > 0,
        )));

        if ($recipientIds === []) {
            return [];
        }

        return User::query()
            ->whereIn('id', $recipientIds)
            ->where('is_active', true)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
    }

    private function isUserRoleValue(string $value): bool
    {
        foreach (UserRole::cases() as $role) {
            if ($role->value === $value) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $context
     */
    private function renderMessage(?string $template, string $eventType, Hypothesis $hypothesis, array $context): string
    {
        $message = $template ?: sprintf('Hypothesis %d event: %s', $hypothesis->id, $eventType);

        $replacements = [
            '{hyp_id}' => (string) $hypothesis->id,
            '{hyp_code}' => (string) $hypothesis->code,
            '{hyp_title}' => (string) $hypothesis->title,
            '{status}' => $hypothesis->status->value,
        ];

        foreach ($context as $key => $value) {
            if (! is_string($key)) {
                continue;
            }

            $replacements['{'.$key.'}'] = $this->stringify($value);
        }

        return strtr($message, $replacements);
    }

    private function stringify(mixed $value): string
    {
        if ($value instanceof BackedEnum) {
            return (string) $value->value;
        }

        if (is_scalar($value) || $value === null) {
            return (string) $value;
        }

        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($encoded === false) {
            return '';
        }

        return $encoded;
    }

    private function telegramEnabled(?string $channel): bool
    {
        if (! is_string($channel) || $channel === '') {
            return false;
        }

        return str_contains(strtolower($channel), 'telegram');
    }
}
