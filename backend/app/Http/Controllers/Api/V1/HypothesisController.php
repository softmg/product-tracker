<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\HypothesisStatus;
use App\Enums\Priority;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHypothesisRequest;
use App\Http\Requests\UpdateHypothesisRequest;
use App\Http\Resources\HypothesisListResource;
use App\Http\Resources\HypothesisResource;
use App\Models\Hypothesis;
use App\Models\User;
use App\Services\HypothesisCodeGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HypothesisController extends Controller
{
    public function __construct(private readonly HypothesisCodeGenerator $hypothesisCodeGenerator)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Hypothesis::query()->with([
            'initiator:id,name',
            'owner:id,name',
            'team:id,name',
        ]);

        $status = $request->query('status');
        if (is_string($status) && $status !== '') {
            $query->where('status', $status);
        }

        $teamId = $request->query('team_id');
        if (is_scalar($teamId) && $teamId !== '') {
            $query->where('team_id', (int) $teamId);
        }

        $initiatorId = $request->query('initiator_id');
        if (is_scalar($initiatorId) && $initiatorId !== '') {
            $query->where('initiator_id', (int) $initiatorId);
        }

        $ownerId = $request->query('owner_id');
        if (is_scalar($ownerId) && $ownerId !== '') {
            $query->where('owner_id', (int) $ownerId);
        }

        $priority = $request->query('priority');
        if (is_string($priority) && $priority !== '') {
            $query->where('priority', $priority);
        }

        $search = $request->query('search');
        if (is_string($search) && trim($search) !== '') {
            $needle = trim($search);

            $query->where(static function ($builder) use ($needle): void {
                $builder
                    ->where('code', 'like', "%{$needle}%")
                    ->orWhere('title', 'like', "%{$needle}%")
                    ->orWhere('description', 'like', "%{$needle}%")
                    ->orWhere('problem', 'like', "%{$needle}%")
                    ->orWhere('solution', 'like', "%{$needle}%")
                    ->orWhere('target_audience', 'like', "%{$needle}%");
            });
        }

        $allowedSortColumns = ['created_at', 'updated_at', 'scoring_primary', 'status'];
        $sortBy = $request->query('sort_by');
        $sortColumn = is_string($sortBy) && in_array($sortBy, $allowedSortColumns, true)
            ? $sortBy
            : 'created_at';

        $sortDirection = $request->query('sort_dir') === 'asc' ? 'asc' : 'desc';

        $perPage = (int) ($request->query('per_page', 15));
        $perPage = max(1, min($perPage, 100));

        return HypothesisListResource::collection(
            $query
                ->orderBy($sortColumn, $sortDirection)
                ->paginate($perPage)
                ->withQueryString(),
        );
    }

    public function store(StoreHypothesisRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validated();
        $data['code'] = $this->hypothesisCodeGenerator->generate();
        $data['status'] = HypothesisStatus::Backlog->value;
        $data['priority'] = $data['priority'] ?? Priority::Medium->value;
        $data['initiator_id'] = $user->id;

        $hypothesis = Hypothesis::query()->create($data);

        return (new HypothesisResource($hypothesis->load($this->detailRelations())))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Hypothesis $hypothesis): HypothesisResource
    {
        return new HypothesisResource($hypothesis->load($this->detailRelations()));
    }

    public function update(UpdateHypothesisRequest $request, Hypothesis $hypothesis): HypothesisResource
    {
        $hypothesis->update($request->validated());

        return new HypothesisResource($hypothesis->load($this->detailRelations()));
    }

    public function destroy(Request $request, Hypothesis $hypothesis): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== UserRole::Admin) {
            abort(403);
        }

        $hypothesis->delete();

        return response()->json([], 204);
    }

    /**
     * @return array<int, string>
     */
    private function detailRelations(): array
    {
        return [
            'initiator',
            'owner',
            'team',
            'scorings',
            'deepDives.stage',
            'experiments',
            'committeeVotes.member.user',
            'statusHistory.changedBy',
        ];
    }
}
