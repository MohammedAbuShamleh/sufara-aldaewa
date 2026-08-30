<?php
// بعد النشر: نفّذ php artisan route:clear على السيرفر (وإن كنت تستخدم route:cache فأعد تشغيله)

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TagController;
use Illuminate\Support\Facades\Route;

// للتحقق من أن الـ API يعمل (يظهر عند فتح /api في المتصفح)
Route::get('', function () {
    return ['message' => 'Religious Activities Survey API', 'status' => 'ok'];
});

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // الخروج متاح دائماً — حتى للحساب المعطّل، حتى يستطيع إنهاء جلسته.
    Route::post('/logout', [AuthController::class, 'logout']);

    // ── كل ما بعده محجوب عن الحسابات المعطّلة ─────────────────────
    Route::middleware('user.active')->group(function () {

        // ── مسارات متاحة قبل الموافقة على العقد ──────────────────────
        // لولا استثناؤها لَحُبس من لم يوافق بلا طريق لقراءة العقد أو الرد عليه أو الخروج.
        Route::get('/user', [AuthController::class, 'user']);

        // عقد الكفالة الإلكتروني — يُعرض لكل مستخدم بعد الدخول حتى يوافق عليه
        Route::get('/contract', [ContractController::class, 'show']);
        Route::post('/contract/agree', [ContractController::class, 'agree']);
        Route::post('/contract/decline', [ContractController::class, 'decline']);

        // ── بقية النظام: محجوبة حتى تُسجَّل الموافقة على النسخة الحالية ──
        Route::middleware('contract.agreed')->group(function () {
            Route::patch('/user/notes', [AuthController::class, 'updateMyNotes']);

            // كشف الإدارة للعقد وتصديره وحذف غير الموافقين (أدمن فقط)
            Route::get('/contract/status', [ContractController::class, 'status']);
            Route::get('/contract/status/export', [ContractController::class, 'exportStatus']);
            Route::delete('/contract/decliners', [ContractController::class, 'destroyDecliners']);

            // مسارات إدارة المستخدمين (أدمن فقط)
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/{user}', [UserController::class, 'show']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::patch('/users/{user}/notes', [UserController::class, 'updateNotes']);
            // تعطيل/تفعيل الحساب — البديل عن الحذف (يحفظ سجل الداعية ونماذجه)
            Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);
            Route::post('/users', [UserController::class, 'store']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
            Route::get('/users/download-template', [UserController::class, 'downloadTemplate']);
            Route::post('/users/import-excel', [UserController::class, 'importExcel']);

            // قائمة الصفات (Tags) — لملء قوائم الاختيار والفلترة
            Route::get('/tags', [TagController::class, 'index']);

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
            // قوائم الفلترة المقيّدة بنطاق صلاحيات العارض
            Route::get('/dashboard/governorates', [DashboardController::class, 'governorates']);
            Route::get('/dashboard/sub-regions', [DashboardController::class, 'subRegions']);
            Route::get('/export/excel/{form}', [ExportController::class, 'export']);
            Route::get('/export/excel-all', [ExportController::class, 'exportAll']);
        });

    });
});

// ===== طلبات التحاق معهد بصائر (عام، بدون مصادقة) =====
Route::post('/basair/applications', [\App\Http\Controllers\BasairApplicationController::class, 'store'])
    ->middleware('throttle:5,1');

// ===== إدارة طلبات بصائر (محمية بتوكن مستقل) =====
Route::prefix('basair/admin')->group(function () {
    Route::get('/applications',  [\App\Http\Controllers\BasairAdminController::class, 'index']);
    Route::patch('/applications/{application}', [\App\Http\Controllers\BasairAdminController::class, 'update']);
    Route::delete('/applications/{application}', [\App\Http\Controllers\BasairAdminController::class, 'destroy']);
    Route::get('/export', [\App\Http\Controllers\BasairAdminController::class, 'export']);
});
