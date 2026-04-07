<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommitteeMemberRequest extends FormRequest
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
            'user_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('committee_members', 'user_id')->ignore($this->route('committeeMember')),
            ],
            'display_role' => ['sometimes', 'nullable', 'string', 'max:255'],
            'order' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
