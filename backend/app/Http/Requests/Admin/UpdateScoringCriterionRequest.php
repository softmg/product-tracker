<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScoringCriterionRequest extends FormRequest
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
            'description' => ['sometimes', 'nullable', 'string'],
            'input_type' => ['sometimes', 'required', 'string', 'max:50'],
            'min_value' => ['sometimes', 'required', 'integer'],
            'max_value' => ['sometimes', 'required', 'integer', 'gte:min_value'],
            'weight' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'thresholds' => ['sometimes', 'nullable', 'array'],
            'is_stop_factor' => ['sometimes', 'boolean'],
            'stage' => ['sometimes', 'required', 'string', 'in:primary,deep'],
            'order' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
