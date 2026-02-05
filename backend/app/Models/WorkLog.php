<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Field;
use App\Models\TaskType;
use App\Models\Product;


class WorkLog extends Model
{
    protected $fillable = [
        'user_id',
        'field_id',
        'task_type_id',
        'product_id',
        'status',
        'started_at',
        'paused_at',
        'ended_at',
        'quantity',
        'unit',
        'memo',
        'measure_type',
        'measure_value',
        'measured_at',
    ];

    protected $casts = [
        'started_at'  => 'datetime',
        'paused_at'   => 'datetime',
        'ended_at'    => 'datetime',
        'measured_at' => 'datetime',
    ];


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function pauseEvents(): HasMany
    {
        return $this->hasMany(PauseEvent::class)->orderBy('at');
    }

}

