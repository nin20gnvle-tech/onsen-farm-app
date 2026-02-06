<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DailyReportController;
use App\Http\Controllers\Api\InviteController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\TemperatureController;
use App\Http\Controllers\Api\WorkLogController;
use App\Http\Controllers\Api\UserController;


Route::get('/masters', [MasterDataController::class, 'index']);
Route::get('/items', [MasterDataController::class, 'items']);
Route::get('/items/movements', [MasterDataController::class, 'movements']);
Route::post('/items/in', [MasterDataController::class, 'stockIn']);
Route::post('/items/out', [MasterDataController::class, 'stockOut']);
Route::post('/items/adjust', [MasterDataController::class, 'stockAdjust']);
Route::get('/daily-reports', [DailyReportController::class, 'show']);
Route::post('/daily-reports', [DailyReportController::class, 'store']);
Route::get('/temperature-locations', [TemperatureController::class, 'locations']);
Route::get('/temperature-readings', [TemperatureController::class, 'readings']);
Route::post('/temperature-readings/batch', [TemperatureController::class, 'saveBatch']);
Route::post('/work-logs/start', [WorkLogController::class, 'start']);
Route::get('/work-logs', [WorkLogController::class, 'index']);
Route::get('/work-logs/active', [WorkLogController::class, 'active']);
Route::get('/work-logs/dashboard', [WorkLogController::class, 'dashboard']);
Route::post('/work-logs/{workLog}/pause', [WorkLogController::class, 'pause']);
Route::post('/work-logs/{workLog}/resume', [WorkLogController::class, 'resume']);
Route::post('/work-logs/{workLog}/stop', [WorkLogController::class, 'stop']);
Route::post('/work-logs/{workLog}/details', [WorkLogController::class, 'updateDetails']);
Route::post('/work-logs/{workLog}/undo', [WorkLogController::class, 'undo']);
Route::get('/work-logs/{workLog}', [WorkLogController::class, 'show']);

Route::get('/invites/{token}', [InviteController::class, 'show']);
Route::post('/invites', [InviteController::class, 'store']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::patch('/users/{user}', [UserController::class, 'update']);






