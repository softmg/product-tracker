<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()->with('team');

        $role = $request->query('role');
        if (is_string($role) && $role !== '') {
            $query->where('role', $role);
        }

        $teamId = $request->query('team_id');
        if (is_scalar($teamId) && $teamId !== '') {
            $query->where('team_id', (int) $teamId);
        }

        $isActive = $request->query('is_active');
        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false);
        }

        $search = $request->query('search');
        if (is_string($search) && trim($search) !== '') {
            $needle = trim($search);

            $query->where(static function ($builder) use ($needle): void {
                $builder
                    ->where('name', 'like', "%{$needle}%")
                    ->orWhere('email', 'like', "%{$needle}%");
            });
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        return UserResource::collection($query->orderBy('id')->paginate($perPage)->withQueryString());
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;

        $user = User::query()->create($data);

        return (new UserResource($user->load('team')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load('team'));
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $data = $request->validated();

        if (array_key_exists('password', $data) && $data['password'] === null) {
            unset($data['password']);
        }

        $user->update($data);

        return new UserResource($user->load('team'));
    }

    public function toggleActive(User $user): UserResource
    {
        $user->is_active = ! $user->is_active;
        $user->save();

        return new UserResource($user->load('team'));
    }
}
