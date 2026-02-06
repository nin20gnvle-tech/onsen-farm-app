<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use Illuminate\Http\Request;

class DailyReportController extends Controller
{
    public function show(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $report = DailyReport::query()
            ->where('report_date', $data['date'])
            ->first();

        return response()->json([
            'report' => $report ? [
                'date' => $report->report_date ? (string) $report->report_date : null,
                'weather' => $report->weather,
                'attendance' => $report->attendance,
                'work_content' => $report->work_content,
                'note' => $report->note,
                'created_by_user_id' => $report->created_by_user_id,
                'updated_at' => $report->updated_at,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'weather' => ['nullable', 'string', 'max:255'],
            'attendance' => ['nullable', 'string', 'max:2000'],
            'work_content' => ['nullable', 'string', 'max:4000'],
            'note' => ['nullable', 'string', 'max:4000'],
            'created_by_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $report = DailyReport::query()->updateOrCreate(
            ['report_date' => $data['date']],
            [
                'weather' => $data['weather'] ?? null,
                'attendance' => $data['attendance'] ?? null,
                'work_content' => $data['work_content'] ?? null,
                'note' => $data['note'] ?? null,
                'created_by_user_id' => $data['created_by_user_id'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'saved',
            'report' => [
                'date' => $report->report_date ? (string) $report->report_date : null,
                'weather' => $report->weather,
                'attendance' => $report->attendance,
                'work_content' => $report->work_content,
                'note' => $report->note,
                'created_by_user_id' => $report->created_by_user_id,
                'updated_at' => $report->updated_at,
            ],
        ]);
    }
}
