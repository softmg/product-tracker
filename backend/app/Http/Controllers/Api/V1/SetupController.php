<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SetupController extends Controller
{
    /**
     * Create the first admin account.
     * Only available when no users exist in the system.
     */
    public function createAdmin(Request $request): JsonResponse
    {
        if (User::exists()) {
            return response()->json([
                'message' => 'Setup already completed. The system already has users.',
            ], 403);
        }

        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'              => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role'      => UserRole::Admin,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Admin account created successfully.',
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ], 201);
    }

    /**
     * Returns whether initial setup is still required.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'needs_setup' => ! User::exists(),
        ]);
    }
}
