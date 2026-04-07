<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExperimentRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:interview,landing_page,ads,prototype,a_b_test'],
            'status' => ['nullable', 'string', 'in:planned,running,completed,cancelled'],
            'description' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'responsible_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'metrics' => ['nullable', 'array'],
            'metrics.*.name' => ['required_with:metrics', 'string', 'max:255'],
            'metrics.*.target_value' => ['nullable', 'numeric'],
            'metrics.*.actual_value' => ['nullable', 'numeric'],
            'metrics.*.unit' => ['nullable', 'string', 'max:50'],
            'metrics.*.result' => ['nullable', 'string', 'max:50'],
        ];
    }
}
