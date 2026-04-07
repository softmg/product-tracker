<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRespondentRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'company' => ['sometimes', 'nullable', 'string', 'max:255'],
            'position' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact_source' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'nullable', 'string', 'in:new,contacted,interviewed'],
            'interview_date' => ['sometimes', 'nullable', 'date'],
            'interview_duration' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'interviewer_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'interview_format' => ['sometimes', 'nullable', 'string', 'max:255'],
            'recording_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
        ];
    }
}
