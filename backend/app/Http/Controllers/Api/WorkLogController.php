<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WorkLog;
use App\Models\PauseEvent;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\WorkLogResource;


class WorkLogController extends Controller
{
    /**
     * 作業開始（ログイン無し・検証用）
     */
    public function start(Request $request)
    {
        // バリデーション
        $data = $request->validate([
            'user_id'      => ['nullable', 'exists:users,id'],
            'field_id'     => ['required', 'exists:fields,id'],
            'task_type_id' => ['required', 'exists:task_types,id'],
            'product_id'   => ['nullable', 'exists:products,id'],
        ]);

        $userId = $data['user_id'] ?? User::query()->value('id');
        if (!$userId) {
            return response()->json(['message' => 'no users available'], 422);
        }

        // 二重計測防止（同一ユーザーで当日 running / paused が残っていたらNG）
        $today = now();
        $start = $today->copy()->startOfDay();
        $end = $today->copy()->endOfDay();
        $exists = WorkLog::where('user_id', $userId)
            ->whereIn('status', ['running', 'paused'])
            ->whereBetween('started_at', [$start, $end])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'already running or paused work log exists'
            ], 409);
        }

        // 作業ログ作成
        $workLog = WorkLog::create([
            'user_id'      => $userId,
            'field_id'     => $data['field_id'],
            'task_type_id' => $data['task_type_id'],
            'product_id'   => $data['product_id'] ?? null,
            'status'       => 'running',
            'started_at'   => now(),
        ]);

        return response()->json($workLog, 201);
    }

    public function pause(Request $request, WorkLog $workLog)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        if ($workLog->status !== 'running') {
            throw ValidationException::withMessages([
                'status' => ['work log must be running to pause'],
            ]);
        }

        $workLog->update([
            'status' => 'paused',
            'paused_at' => now(),
        ]);

        PauseEvent::create([
            'work_log_id' => $workLog->id,
            'user_id' => $data['user_id'],
            'action' => 'pause',
            'at' => now(),
        ]);

        return response()->json($workLog->fresh(), 200);
    }

    public function updateDetails(Request $request, WorkLog $workLog)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'quantity' => ['nullable', 'numeric'],
            'unit' => ['nullable', 'string', 'max:50'],
            'memo' => ['nullable', 'string', 'max:500'],
        ]);

        if ($workLog->status !== 'done') {
            throw ValidationException::withMessages([
                'status' => ['work log must be done to edit details'],
            ]);
        }

        $workLog->update([
            'quantity' => $data['quantity'] ?? null,
            'unit' => $data['unit'] ?? null,
            'memo' => $data['memo'] ?? null,
        ]);

        return response()->json($workLog->fresh(), 200);
    }

    public function undo(Request $request, WorkLog $workLog)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        if ($workLog->status !== 'done') {
            throw ValidationException::withMessages([
                'status' => ['work log must be done to undo'],
            ]);
        }

        $workLog->update([
            'status' => 'running',
            'ended_at' => null,
        ]);

        return response()->json($workLog->fresh(), 200);
    }

    public function resume(Request $request, WorkLog $workLog)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        if ($workLog->status !== 'paused') {
            throw ValidationException::withMessages([
                'status' => ['work log must be paused to resume'],
            ]);
        }

        $workLog->update([
            'status' => 'running',
            'paused_at' => null,
        ]);

        PauseEvent::create([
            'work_log_id' => $workLog->id,
            'user_id' => $data['user_id'],
            'action' => 'resume',
            'at' => now(),
        ]);

        return response()->json($workLog->fresh(), 200);
    }

    public function stop(Request $request, WorkLog $workLog)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'quantity' => ['nullable', 'numeric'],
            'unit' => ['nullable', 'string', 'max:50'],
            'memo' => ['nullable', 'string', 'max:500'],
        ]);

        if (!in_array($workLog->status, ['running', 'paused'], true)) {
            throw ValidationException::withMessages([
                'status' => ['work log must be running or paused to stop'],
            ]);
        }

        $workLog->update([
            'status' => 'done',
            'ended_at' => now(),
            'paused_at' => null,
            'quantity' => $data['quantity'] ?? null,
            'unit' => $data['unit'] ?? null,
            'memo' => $data['memo'] ?? null,
        ]);

        return response()->json($workLog->fresh(), 200);
    }

    public function index(Request $request)
    {
    $query = WorkLog::query()
        ->with(['user:id,name', 'field:id,name', 'taskType:id,name', 'product:id,name', 'pauseEvents:id,work_log_id,action,at'])
        ->withCount('pauseEvents')
        ->orderByDesc('started_at');

    // date=YYYY-MM-DD が来たら、その日の started_at で絞る
    if ($request->filled('date')) {
        $data = $request->validate([
            'date' => ['date_format:Y-m-d'],
        ]);

        $start = \Carbon\Carbon::createFromFormat('Y-m-d', $data['date'])->startOfDay();
        $end   = \Carbon\Carbon::createFromFormat('Y-m-d', $data['date'])->endOfDay();

        $query->whereBetween('started_at', [$start, $end]);
    } else {
        $query->limit(20);
    }

    return \App\Http\Resources\WorkLogResource::collection($query->get());
}



public function show(WorkLog $workLog)
{
    $workLog->load(['user:id,name', 'field:id,name', 'taskType:id,name', 'product:id,name']);

    return new WorkLogResource($workLog);
}

public function destroy(WorkLog $workLog)
{
    if ($workLog->status !== 'done') {
        throw ValidationException::withMessages([
            'status' => ['work log must be done to delete'],
        ]);
    }

    $workLog->delete();

    return response()->json(['message' => 'deleted']);
}

public function active(Request $request)
{
    $data = $request->validate([
        'date' => ['nullable', 'date_format:Y-m-d'],
    ]);

    $date = isset($data['date'])
        ? \Carbon\Carbon::createFromFormat('Y-m-d', $data['date'])
        : now();

    $start = $date->copy()->startOfDay();
    $end   = $date->copy()->endOfDay();

    $items = WorkLog::query()
        ->with(['user:id,name', 'field:id,name', 'taskType:id,name', 'product:id,name', 'pauseEvents:id,work_log_id,action,at'])
        ->withCount('pauseEvents')
        ->whereBetween('started_at', [$start, $end])
        ->whereIn('status', ['running', 'paused'])
        ->orderByDesc('started_at')
        ->get();

    $resourceItems = WorkLogResource::collection($items)->resolve();

$grouped = collect($resourceItems)
    ->groupBy(fn ($row) => $row['field']['id'] ?? 0)
    ->map(function ($logs) {
        $first = $logs->first();

      return [
    'field' => $first['field'] ?? null,
    'logs' => array_values($logs->map(function ($row) {
        unset($row['field']);
        return $row;
    })->all()),
];

    })
    ->values()
    ->all();

return response()->json(['data' => $grouped]);

}

public function dashboard(Request $request)
{
    $data = $request->validate([
        'date' => ['nullable', 'date_format:Y-m-d'],
    ]);

    $date = isset($data['date'])
        ? \Carbon\Carbon::createFromFormat('Y-m-d', $data['date'])
        : now();

    $start = $date->copy()->startOfDay();
    $end   = $date->copy()->endOfDay();

    // 共通：当日範囲 + 関連読み込み
    $baseQuery = WorkLog::query()
        ->with(['user:id,name', 'field:id,name', 'taskType:id,name', 'product:id,name', 'pauseEvents:id,work_log_id,action,at'])
        ->withCount('pauseEvents')
        ->whereBetween('started_at', [$start, $end])
        ->orderByDesc('started_at');

    $activeItems = (clone $baseQuery)
        ->whereIn('status', ['running', 'paused'])
        ->get();

    $doneItems = (clone $baseQuery)
        ->where('status', 'done')
        ->get();

    $groupByField = function ($items) {
        $resourceItems = WorkLogResource::collection($items)->resolve();

        return collect($resourceItems)
            ->groupBy(fn ($row) => $row['field']['id'] ?? 0)
            ->map(function ($logs) {
                $first = $logs->first();

                return [
                    'field' => $first['field'] ?? null,
                    'logs' => array_values(
    $logs
      ->sortBy(fn ($row) => $row['timeline_at'] ?? $row['started_at'] ?? '')
      ->map(function ($row) {
          unset($row['field']);
          return $row;
      })
      ->all()
),

                ];
            })
            ->values()
            ->all();
    };

    return response()->json([
        'date' => $date->format('Y-m-d'),
        'active' => $groupByField($activeItems),
        'done'   => $groupByField($doneItems),
    ]);
}




}
