<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TelegramNotifier
{
    public function send(string $chatId, string $message): void
    {
        $botToken = (string) config('services.telegram.bot_token', '');

        if ($botToken === '' || trim($chatId) === '') {
            Log::warning('Telegram notification skipped: missing config');

            return;
        }

        try {
            $response = Http::asForm()->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);

            if ($response->failed()) {
                Log::warning('Telegram notification request failed', [
                    'status' => $response->status(),
                ]);
            }
        } catch (Throwable $exception) {
            Log::warning('Telegram notification request failed', [
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
