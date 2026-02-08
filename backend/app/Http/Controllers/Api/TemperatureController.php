<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemperatureLocation;
use App\Models\TemperatureReading;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TemperatureController extends Controller
{
    public function locations()
    {
        $locations = TemperatureLocation::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name', 'type', 'field_id', 'sort_order']);

        return response()->json(['locations' => $locations]);
    }

    public function readings(Request $request)
    {
        $data = $request->validate([
            'location_id' => ['required', 'exists:temperature_locations,id'],
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $month = $data['month'] ?? now()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        $readings = TemperatureReading::query()
            ->where('location_id', $data['location_id'])
            ->whereBetween('measured_at', [$start, $end])
            ->orderBy('measured_at')
            ->get(['measured_at', 'temperature', 'humidity']);

        return response()->json(['readings' => $readings]);
    }

    public function saveBatch(Request $request)
    {
        $payload = $request->all();
        $payload['readings'] = array_map(function ($row) {
            return [
                'measured_at' => $row['measured_at'] ?? null,
                'temperature' => isset($row['temperature']) && $row['temperature'] === '' ? null : ($row['temperature'] ?? null),
                'humidity' => isset($row['humidity']) && $row['humidity'] === '' ? null : ($row['humidity'] ?? null),
                'source' => $row['source'] ?? null,
                'device_id' => $row['device_id'] ?? null,
            ];
        }, $payload['readings'] ?? []);

        $validator = Validator::make($payload, [
            'location_id' => ['required', 'exists:temperature_locations,id'],
            'readings' => ['nullable', 'array'],
            'readings.*.measured_at' => ['required', 'date'],
            'readings.*.temperature' => ['nullable', 'numeric'],
            'readings.*.humidity' => ['nullable', 'numeric'],
            'readings.*.source' => ['nullable', 'string', 'max:30'],
            'readings.*.device_id' => ['nullable', 'string', 'max:100'],
        ]);

        $data = $validator->validate();

        $saved = 0;

        if (empty($data['readings'])) {
            return response()->json(['message' => 'saved', 'count' => 0]);
        }

        DB::transaction(function () use ($data, &$saved) {
            foreach ($data['readings'] as $row) {
                $temperature = $row['temperature'];
                $humidity = $row['humidity'];
                $measuredAt = Carbon::parse($row['measured_at'])->format('Y-m-d H:i:s');

                if ($temperature === null && $humidity === null) {
                    TemperatureReading::query()
                        ->where('location_id', $data['location_id'])
                        ->where('measured_at', $measuredAt)
                        ->delete();
                    continue;
                }

                TemperatureReading::query()->updateOrCreate(
                    [
                        'location_id' => $data['location_id'],
                        'measured_at' => $measuredAt,
                    ],
                    [
                        'measured_at' => $measuredAt,
                        'temperature' => $temperature,
                        'humidity' => $humidity,
                        'source' => $row['source'] ?? 'manual',
                        'device_id' => $row['device_id'] ?? null,
                    ]
                );
                $saved++;
            }
        });

        return response()->json(['message' => 'saved', 'count' => $saved]);
    }
}
