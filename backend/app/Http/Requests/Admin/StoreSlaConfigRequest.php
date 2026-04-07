<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\HypothesisStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreSlaConfigRequest extends FormRequest
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
            'status' => ['required', new Enum(HypothesisStatus::class), 'unique:sla_configs,status'],
            'limit_days' => ['required', 'integer', 'min:1'],
            'warning_days' => ['required', 'integer', 'min:0', 'lte:limit_days'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
