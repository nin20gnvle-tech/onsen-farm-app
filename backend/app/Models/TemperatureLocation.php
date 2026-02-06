<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemperatureLocation extends Model
{
    protected $fillable = [
        'name',
        'type',
        'field_id',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function readings(): HasMany
    {
        return $this->hasMany(TemperatureReading::class, 'location_id');
    }
}
