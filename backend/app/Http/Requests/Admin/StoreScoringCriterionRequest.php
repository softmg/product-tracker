<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreScoringCriterionRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'input_type' => ['required', 'string', 'max:50'],
            'min_value' => ['required', 'integer'],
            'max_value' => ['required', 'integer', 'gte:min_value'],
            'weight' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'thresholds' => ['nullable', 'array'],
            'is_stop_factor' => ['sometimes', 'boolean'],
            'stage' => ['required', 'string', 'in:primary,deep'],
            'order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
