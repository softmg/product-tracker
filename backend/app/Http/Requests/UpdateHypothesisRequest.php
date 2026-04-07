<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateHypothesisRequest extends FormRequest
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
            'description' => ['sometimes', 'nullable', 'string'],
            'problem' => ['sometimes', 'nullable', 'string'],
            'solution' => ['sometimes', 'nullable', 'string'],
            'assumptions' => ['sometimes', 'nullable', 'string'],
            'target_audience' => ['sometimes', 'nullable', 'string'],
            'priority' => ['sometimes', 'nullable', new Enum(Priority::class)],
            'owner_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ];
    }
}
