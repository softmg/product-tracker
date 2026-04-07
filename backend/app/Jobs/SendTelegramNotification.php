<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\TelegramNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendTelegramNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(
        public readonly string $chatId,
        public readonly string $message,
    ) {
    }

    public function handle(TelegramNotifier $telegramNotifier): void
    {
        try {
            $telegramNotifier->send($this->chatId, $this->message);
        } catch (Throwable $exception) {
            Log::warning('Telegram notification job failed', [
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
