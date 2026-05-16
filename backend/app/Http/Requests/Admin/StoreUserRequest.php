<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreUserRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', new Enum(UserRole::class)],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['required', new Enum(UserRole::class)],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
