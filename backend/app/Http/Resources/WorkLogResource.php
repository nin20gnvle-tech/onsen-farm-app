<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkLogResource extends JsonResource
{
    private function fmtTime($dt): ?string
    {
        return $dt?->timezone('Asia/Tokyo')?->format('H:i');
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,

            'started_at' => $this->started_at,
            // タイムライン表示用
            'started_time' => $this->fmtTime($this->started_at),
            'paused_time'  => $this->fmtTime($this->paused_at),
            'ended_time'   => $this->fmtTime($this->ended_at),

            // 並び替え用（Reactが楽）
            'timeline_at' => match ($this->status) {
                'done'   => $this->ended_at,   // 完了は「完了時刻」で並べたい
                'paused' => $this->paused_at,  // 一時停止は「止めた時刻」
                default  => $this->started_at, // runningは「開始時刻」
            },

            'timeline_time' => $this->fmtTime(match ($this->status) {
                'done'   => $this->ended_at,
                'paused' => $this->paused_at,
                default  => $this->started_at,
            }),


            'paused_at' => $this->paused_at,
            'ended_at' => $this->ended_at,
            'pause_count' => $this->pause_events_count ?? 0,
            'pause_events' => $this->whenLoaded('pauseEvents', fn () => $this->pauseEvents->map(fn ($e) => [
                'action' => $e->action,
                'time' => $this->fmtTime($e->at),
            ])->values()),

            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),

            'field' => $this->whenLoaded('field', fn () => [
                'id' => $this->field->id,
                'name' => $this->field->name,
            ]),

            'task_type' => $this->whenLoaded('taskType', fn () => [
                'id' => $this->taskType->id,
                'name' => $this->taskType->name,
            ]),

            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
            ] : null),

            // 任意入力（後で使う）
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'memo' => $this->memo,
        ];
    }
}
