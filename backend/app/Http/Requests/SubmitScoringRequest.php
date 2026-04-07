<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitScoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'stage' => $this->route('stage'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'stage' => ['required', 'string', 'in:primary,deep'],
            'criteria_scores' => ['required', 'array', 'min:1'],
            'criteria_scores.*' => ['required', 'numeric', 'min:0'],
        ];
    }
}
