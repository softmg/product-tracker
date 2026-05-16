<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $roles = $this->input('roles');
        $role = $this->input('role');

        if ($roles === null && is_string($role) && $role !== '') {
            $this->merge(['roles' => [$role]]);
        }

        if (($role === null || $role === '') && is_array($roles) && isset($roles[0])) {
            $this->merge(['role' => $roles[0]]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('user')),
            ],
            'role' => ['sometimes', 'required', new Enum(UserRole::class)],
            'roles' => ['sometimes', 'required', 'array', 'min:1'],
            'roles.*' => ['required', new Enum(UserRole::class)],
            'team_id' => ['sometimes', 'nullable', 'integer', 'exists:teams,id'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ];
    }
}
