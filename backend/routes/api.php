<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WorkLogController;


Route::post('/work-logs/start', [WorkLogController::class, 'start']);
Route::get('/work-logs', [WorkLogController::class, 'index']);
Route::get('/work-logs/active', [WorkLogController::class, 'active']);
Route::get('/work-logs/dashboard', [WorkLogController::class, 'dashboard']);
Route::post('/work-logs/{workLog}/pause', [WorkLogController::class, 'pause']);
Route::post('/work-logs/{workLog}/resume', [WorkLogController::class, 'resume']);
Route::post('/work-logs/{workLog}/stop', [WorkLogController::class, 'stop']);
Route::get('/work-logs/{workLog}', [WorkLogController::class, 'show']);






