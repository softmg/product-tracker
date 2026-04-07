<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreHypothesisRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'problem' => ['nullable', 'string'],
            'solution' => ['nullable', 'string'],
            'assumptions' => ['nullable', 'string'],
            'target_audience' => ['nullable', 'string'],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
            'priority' => ['nullable', new Enum(Priority::class)],
        ];
    }
}
