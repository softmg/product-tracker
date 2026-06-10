<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserOptionResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserOptionsController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->query('search');

        $query = User::query()
            ->select(['id', 'name', 'email'])
            ->where('is_active', true)
            ->orderBy('name');

        if (is_string($search) && trim($search) !== '') {
            $needle = trim($search);

            $query->where(static function ($builder) use ($needle): void {
                $builder
                    ->where('name', 'like', "%{$needle}%")
                    ->orWhere('email', 'like', "%{$needle}%");
            });
        }

        return new AnonymousResourceCollection(
            $query->get(),
            UserOptionResource::class,
        );
    }
}
