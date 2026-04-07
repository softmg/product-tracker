<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExperimentResultRequest extends FormRequest
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
            'result' => ['required', 'string', 'max:100'],
            'what_worked' => ['nullable', 'string'],
            'what_not_worked' => ['nullable', 'string'],
        ];
    }
}
