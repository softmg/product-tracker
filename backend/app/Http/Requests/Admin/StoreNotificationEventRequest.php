<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificationEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'event_type' => ['required', 'string', 'max:255', 'unique:notification_events,event_type'],
            'is_active' => ['sometimes', 'boolean'],
            'recipients' => ['required', 'array', 'min:1'],
            'recipients.*' => ['required', 'string', 'max:100'],
            'template' => ['nullable', 'string'],
            'channel' => ['nullable', 'string', 'max:100'],
        ];
    }
}
