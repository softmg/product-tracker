<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateDeepDiveStageRequest extends FormRequest
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
            'order' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_required' => ['sometimes', 'boolean'],
            'responsible_role' => ['sometimes', 'required', new Enum(UserRole::class)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
