<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    public const ENTITY_TYPE_HYPOTHESIS = 'hypothesis';

    public const ENTITY_TYPE_EXPERIMENT = 'experiment';

    public const ENTITY_TYPE_USER = 'user';

    public const ENTITY_TYPE_TEAM = 'team';

    public const ENTITY_TYPE_SETTINGS = 'settings';

    public const ACTION_CREATE = 'create';

    public const ACTION_UPDATE = 'update';

    public const ACTION_DELETE = 'delete';

    public const ACTION_STATUS_CHANGE = 'status_change';

    public const ENTITY_TYPES = [
        self::ENTITY_TYPE_HYPOTHESIS,
        self::ENTITY_TYPE_EXPERIMENT,
        self::ENTITY_TYPE_USER,
        self::ENTITY_TYPE_TEAM,
        self::ENTITY_TYPE_SETTINGS,
    ];

    public const ACTIONS = [
        self::ACTION_CREATE,
        self::ACTION_UPDATE,
        self::ACTION_DELETE,
        self::ACTION_STATUS_CHANGE,
    ];

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'entity_type',
        'entity_id',
        'action',
        'changes',
        'user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'entity_id' => 'integer',
            'changes' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
