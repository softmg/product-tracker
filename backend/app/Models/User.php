<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
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
        'sso_provider',
        'sso_subject',
        'role',
        'roles',
        'team_id',
        'is_active',
        'email_verified_at',
        'last_login_at',
        'sso_last_login_at',
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
            'roles' => 'array',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'sso_last_login_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(static function (User $user): void {
            $roles = self::normalizeRoleValues($user->roles);

            if ($roles === []) {
                $roles = self::normalizeRoleValues($user->role);
            }

            if ($roles === []) {
                $roles = [UserRole::Initiator->value];
            }

            $user->attributes['role'] = $roles[0];
            $user->attributes['roles'] = json_encode($roles);
        });
    }

    /**
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeWithRole(Builder $query, UserRole|string $role): Builder
    {
        $value = $role instanceof UserRole ? $role->value : $role;

        return $query->where(static function (Builder $builder) use ($value): void {
            $builder
                ->where('role', $value)
                ->orWhereJsonContains('roles', $value);
        });
    }

    /**
     * @return array<int, UserRole>
     */
    public function roleEnums(): array
    {
        return array_values(array_filter(array_map(
            static fn (string $role): ?UserRole => UserRole::tryFrom($role),
            $this->roleValues(),
        )));
    }

    /**
     * @return array<int, string>
     */
    public function roleValues(): array
    {
        $roles = self::normalizeRoleValues($this->roles);

        if ($roles === []) {
            $roles = self::normalizeRoleValues($this->role);
        }

        return $roles;
    }

    public function hasRole(UserRole $role): bool
    {
        return in_array($role->value, $this->roleValues(), true);
    }

    /**
     * @param  array<int, UserRole>  $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    public function setRolesAttribute(mixed $roles): void
    {
        $this->attributes['roles'] = json_encode(self::normalizeRoleValues($roles));
    }

    /**
     * @return array<int, string>
     */
    public static function normalizeRoleValues(mixed $roles): array
    {
        if ($roles instanceof UserRole) {
            $roles = [$roles->value];
        } elseif (is_string($roles)) {
            $roles = [$roles];
        } elseif (! is_array($roles)) {
            return [];
        }

        $normalized = [];

        foreach ($roles as $role) {
            if ($role instanceof UserRole) {
                $value = $role->value;
            } elseif (is_scalar($role)) {
                $value = strtolower(trim((string) $role));
            } else {
                continue;
            }

            if (UserRole::tryFrom($value) instanceof UserRole && ! in_array($value, $normalized, true)) {
                $normalized[] = $value;
            }
        }

        return $normalized;
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
