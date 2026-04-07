<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\HypothesisStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class ChangeStatusRequest extends FormRequest
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
            'to_status' => ['required', new Enum(HypothesisStatus::class)],
            'comment' => ['nullable', 'string'],
        ];
    }
}
