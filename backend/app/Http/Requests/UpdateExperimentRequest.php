<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExperimentRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'in:interview,landing_page,ads,prototype,a_b_test'],
            'status' => ['sometimes', 'nullable', 'string', 'in:planned,running,completed,cancelled'],
            'description' => ['sometimes', 'nullable', 'string'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'responsible_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'metrics' => ['sometimes', 'array'],
            'metrics.*.name' => ['required_with:metrics', 'string', 'max:255'],
            'metrics.*.target_value' => ['nullable', 'numeric'],
            'metrics.*.actual_value' => ['nullable', 'numeric'],
            'metrics.*.unit' => ['nullable', 'string', 'max:50'],
            'metrics.*.result' => ['nullable', 'string', 'max:50'],
        ];
    }
}
