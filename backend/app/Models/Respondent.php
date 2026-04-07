<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Respondent extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'hypothesis_id',
        'name',
        'company',
        'position',
        'email',
        'phone',
        'contact_source',
        'status',
        'interview_date',
        'interview_duration',
        'interviewer_user_id',
        'interview_format',
        'recording_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'interview_date' => 'datetime',
            'interview_duration' => 'integer',
        ];
    }

    public function hypothesis(): BelongsTo
    {
        return $this->belongsTo(Hypothesis::class);
    }

    public function interviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'interviewer_user_id');
    }

    public function pains(): HasMany
    {
        return $this->hasMany(RespondentPain::class);
    }

    public function artifacts(): HasMany
    {
        return $this->hasMany(RespondentArtifact::class);
    }
}
