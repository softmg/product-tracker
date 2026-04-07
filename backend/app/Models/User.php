<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'team_id',
        'is_active',
        'last_login_at',
    ];

    /**
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function initiatedHypotheses(): HasMany
    {
        return $this->hasMany(Hypothesis::class, 'initiator_id');
    }

    public function ownedHypotheses(): HasMany
    {
        return $this->hasMany(Hypothesis::class, 'owner_id');
    }

    public function scoredHypothesisScorings(): HasMany
    {
        return $this->hasMany(HypothesisScoring::class, 'scored_by');
    }

    public function completedDeepDives(): HasMany
    {
        return $this->hasMany(HypothesisDeepDive::class, 'completed_by');
    }

    public function uploadedHypothesisFiles(): HasMany
    {
        return $this->hasMany(HypothesisFile::class, 'uploaded_by');
    }

    public function interviewedRespondents(): HasMany
    {
        return $this->hasMany(Respondent::class, 'interviewer_user_id');
    }

    public function createdExperiments(): HasMany
    {
        return $this->hasMany(Experiment::class, 'created_by');
    }

    public function responsibleExperiments(): HasMany
    {
        return $this->hasMany(Experiment::class, 'responsible_user_id');
    }

    public function committeeMember(): HasOne
    {
        return $this->hasOne(CommitteeMember::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
