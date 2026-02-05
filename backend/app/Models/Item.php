<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    protected $fillable = ['name', 'unit', 'is_active'];

    public function movements(): HasMany
    {
        return $this->hasMany(ItemMovement::class)->orderByDesc('created_at');
    }
}
