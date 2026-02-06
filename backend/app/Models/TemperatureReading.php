<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemperatureReading extends Model
{
    protected $fillable = [
        'location_id',
        'measured_at',
        'temperature',
        'humidity',
        'source',
        'device_id',
    ];

    protected $casts = [
        'measured_at' => 'datetime',
        'temperature' => 'float',
        'humidity' => 'float',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(TemperatureLocation::class, 'location_id');
    }
}
