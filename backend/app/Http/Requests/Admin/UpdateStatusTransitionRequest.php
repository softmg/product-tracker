<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\HypothesisStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateStatusTransitionRequest extends FormRequest
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
            'from_status' => ['sometimes', 'required', new Enum(HypothesisStatus::class)],
            'to_status' => ['sometimes', 'required', new Enum(HypothesisStatus::class), 'different:from_status'],
            'allowed_roles' => ['sometimes', 'required', 'array', 'min:1'],
            'allowed_roles.*' => ['required', new Enum(UserRole::class)],
            'condition_type' => ['sometimes', 'required', 'string', 'in:none,required_fields,scoring_threshold,checklist_closed'],
            'condition_value' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
