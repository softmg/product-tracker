<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRespondentRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'contact_source' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:new,contacted,interviewed'],
            'interview_date' => ['nullable', 'date'],
            'interview_duration' => ['nullable', 'integer', 'min:0'],
            'interviewer_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'interview_format' => ['nullable', 'string', 'max:255'],
            'recording_url' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
