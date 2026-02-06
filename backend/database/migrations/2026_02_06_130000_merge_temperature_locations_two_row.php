<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('temperature_locations')) {
            return;
        }

        $right = DB::table('temperature_locations')->where('name', '2連右棟')->first();
        $left = DB::table('temperature_locations')->where('name', '2連左棟')->first();
        $legacy = DB::table('temperature_locations')->where('name', '2連')->first();
        $merged = DB::table('temperature_locations')->where('name', '2連棟')->first();

        if (!$merged) {
            $sortOrder = null;
            $type = 'field';

            if ($right) {
                $sortOrder = $right->sort_order;
                $type = $right->type ?? $type;
            }
            if ($left) {
                $sortOrder = $sortOrder === null ? $left->sort_order : min($sortOrder, $left->sort_order);
                $type = $left->type ?? $type;
            }
            if ($legacy) {
                $sortOrder = $sortOrder === null ? $legacy->sort_order : min($sortOrder, $legacy->sort_order);
                $type = $legacy->type ?? $type;
            }

            $mergedId = DB::table('temperature_locations')->insertGetId([
                'name' => '2連棟',
                'type' => $type,
                'field_id' => null,
                'sort_order' => $sortOrder ?? 0,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $mergedId = $merged->id;
        }

        $oldIds = array_values(array_filter([$right?->id, $left?->id, $legacy?->id]));

        if ($mergedId && !empty($oldIds) && Schema::hasTable('temperature_readings')) {
            $preferred = $right ? $right->id : ($legacy ? $legacy->id : ($left ? $left->id : null));
            if ($preferred) {
                $preferredTimes = DB::table('temperature_readings')
                    ->where('location_id', $preferred)
                    ->pluck('measured_at')
                    ->all();

                if (!empty($preferredTimes)) {
                    DB::table('temperature_readings')
                        ->whereIn('location_id', $oldIds)
                        ->where('location_id', '!=', $preferred)
                        ->whereIn('measured_at', $preferredTimes)
                        ->delete();
                }
            }

            DB::table('temperature_readings')
                ->whereIn('location_id', $oldIds)
                ->update(['location_id' => $mergedId]);
        }

        if (!empty($oldIds)) {
            DB::table('temperature_locations')->whereIn('id', $oldIds)->delete();
        }
    }

    public function down(): void
    {
        // No-op: data was merged and cannot be safely split back.
    }
};
