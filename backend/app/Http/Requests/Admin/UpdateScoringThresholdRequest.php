<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScoringThresholdRequest extends FormRequest
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
            'primary_threshold' => ['required', 'numeric', 'min:0'],
            'deep_threshold' => ['required', 'numeric', 'min:0'],
        ];
    }
}
