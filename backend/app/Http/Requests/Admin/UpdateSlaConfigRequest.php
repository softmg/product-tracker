<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\HypothesisStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

class UpdateSlaConfigRequest extends FormRequest
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
            'status' => [
                'sometimes',
                'required',
                new Enum(HypothesisStatus::class),
                Rule::unique('sla_configs', 'status')->ignore($this->route('slaConfig')),
            ],
            'limit_days' => ['sometimes', 'required', 'integer', 'min:1'],
            'warning_days' => ['sometimes', 'required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $current = $this->route('slaConfig');

            $limitDays = (int) ($this->input('limit_days') ?? $current?->limit_days ?? 0);
            $warningDays = (int) ($this->input('warning_days') ?? $current?->warning_days ?? 0);

            if ($warningDays > $limitDays) {
                $validator->errors()->add('warning_days', 'The warning days must be less than or equal to limit days.');
            }
        });
    }
}
