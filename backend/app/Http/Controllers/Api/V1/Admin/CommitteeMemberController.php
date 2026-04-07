<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCommitteeMemberRequest;
use App\Http\Requests\Admin\UpdateCommitteeMemberRequest;
use App\Http\Resources\CommitteeMemberResource;
use App\Models\CommitteeMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommitteeMemberController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $members = CommitteeMember::query()
            ->with('user')
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        return CommitteeMemberResource::collection($members);
    }

    public function store(StoreCommitteeMemberRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;
        $data['order'] = $data['order'] ?? 0;

        $member = CommitteeMember::query()->create($data);

        return (new CommitteeMemberResource($member->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCommitteeMemberRequest $request, CommitteeMember $committeeMember): CommitteeMemberResource
    {
        $committeeMember->update($request->validated());

        return new CommitteeMemberResource($committeeMember->fresh()->load('user'));
    }

    public function destroy(CommitteeMember $committeeMember): JsonResponse
    {
        $committeeMember->delete();

        return response()->json([], 204);
    }
}
