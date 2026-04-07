<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\HypothesisStatus;
use App\Enums\Priority;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hypothesis extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'title',
        'description',
        'problem',
        'solution',
        'assumptions',
        'target_audience',
        'status',
        'priority',
        'initiator_id',
        'owner_id',
        'team_id',
        'scoring_primary',
        'scoring_deep',
        'sla_deadline',
        'sla_status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => HypothesisStatus::class,
            'priority' => Priority::class,
            'scoring_primary' => 'decimal:2',
            'scoring_deep' => 'decimal:2',
            'sla_deadline' => 'datetime',
        ];
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiator_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(HypothesisStatusHistory::class);
    }

    public function scorings(): HasMany
    {
        return $this->hasMany(HypothesisScoring::class);
    }

    public function deepDives(): HasMany
    {
        return $this->hasMany(HypothesisDeepDive::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(HypothesisFile::class);
    }

    public function respondents(): HasMany
    {
        return $this->hasMany(Respondent::class);
    }

    public function experiments(): HasMany
    {
        return $this->hasMany(Experiment::class);
    }

    public function committeeVotes(): HasMany
    {
        return $this->hasMany(CommitteeVote::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
