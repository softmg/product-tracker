<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTeamRequest;
use App\Http\Requests\Admin\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TeamController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return TeamResource::collection(
            Team::query()
                ->withCount('users')
                ->orderBy('id')
                ->get(),
        );
    }

    public function store(StoreTeamRequest $request): JsonResponse
    {
        $team = Team::query()->create($request->validated());

        return (new TeamResource($team->loadCount('users')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateTeamRequest $request, Team $team): TeamResource
    {
        $team->update($request->validated());

        return new TeamResource($team->loadCount('users'));
    }

    public function destroy(Team $team): JsonResponse
    {
        if ($team->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete team with assigned users.',
            ], 422);
        }

        $team->delete();

        return response()->json([], 204);
    }
}
