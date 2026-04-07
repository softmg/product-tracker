<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNotificationEventRequest extends FormRequest
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
            'event_type' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('notification_events', 'event_type')->ignore($this->route('notificationEvent')),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'recipients' => ['sometimes', 'required', 'array', 'min:1'],
            'recipients.*' => ['required', 'string', 'max:100'],
            'template' => ['sometimes', 'nullable', 'string'],
            'channel' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }
}
