<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HypothesisStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'hypothesis_status_history';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'hypothesis_id',
        'from_status',
        'to_status',
        'changed_by',
        'comment',
    ];

    public function hypothesis(): BelongsTo
    {
        return $this->belongsTo(Hypothesis::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
