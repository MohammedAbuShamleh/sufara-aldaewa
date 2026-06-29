<?php
// بعد النشر: نفّذ php artisan route:clear على السيرفر (وإن كنت تستخدم route:cache فأعد تشغيله)

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// للتحقق من أن الـ API يعمل (يظهر عند فتح /api في المتصفح)
Route::get('', function () {
    return ['message' => 'Religious Activities Survey API', 'status' => 'ok'];
});

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::patch('/user/notes', [AuthController::class, 'updateMyNotes']);

    // مسارات إدارة المستخدمين (أدمن فقط)
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::patch('/users/{user}/notes', [UserController::class, 'updateNotes']);
    Route::post('/users', [UserController::class, 'store']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::get('/users/download-template', [UserController::class, 'downloadTemplate']);
    Route::post('/users/import-excel', [UserController::class, 'importExcel']);

    // نموذج الشهر الحالي للمستخدم (إن لم يوجد يُنشأ فارغاً)
    Route::get('/forms/my-form', [FormController::class, 'myForm']);

    // إنشاء وتحديث وعرض النماذج (محمية، ملكية المستخدم)
    Route::post('/forms', [FormController::class, 'store']);
    Route::get('/forms/{form}', [FormController::class, 'show']);
    Route::put('/forms/{form}', [FormController::class, 'update']);

    // الأنشطة (محمية، التحقق من ملكية النموذج)
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::put('/activities/{activity}', [ActivityController::class, 'update']);
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy']);

    // مسارات الإدارة (لوحة التحكم)
    Route::get('/forms', [FormController::class, 'index']);
    Route::delete('/forms/{form}', [FormController::class, 'destroy']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/export/excel/{form}', [ExportController::class, 'export']);
    Route::get('/export/excel-all', [ExportController::class, 'exportAll']);
});
