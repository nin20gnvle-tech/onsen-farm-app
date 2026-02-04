<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PauseEvent extends Model
{
    protected $fillable = [
        'work_log_id',
        'user_id',
        'action',
        'at',
    ];

    protected $casts = [
        'at' => 'datetime',
    ];
}
