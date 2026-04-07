<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RespondentPain extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'respondent_id',
        'tag',
        'quote',
    ];

    public function respondent(): BelongsTo
    {
        return $this->belongsTo(Respondent::class);
    }
}
