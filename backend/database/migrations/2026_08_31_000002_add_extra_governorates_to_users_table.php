<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * محافظات إضافية لمسؤول المحافظة.
 *
 * بعض المسؤولين يغطّون أكثر من محافظة («الجنوب» = خان يونس + رفح مثلاً)، بينما
 * كان النطاق يطابق العمود governorate وحده — فيرى واحدة ويُحجب عن الأخرى.
 *
 * لم نوسّع العمود governorate نفسه ليحمل قائمة، لأنه مصدر «محافظة المستخدم»
 * المعروضة في التقارير والمشتقّة منها قائمة الفلترة (DashboardController::governorates)،
 * فحشو قائمة فيه يُفسد الاثنين. هذا العمود للنطاق فقط.
 *
 * الصيغة: أسماء مفصولة بفاصلة (عربية أو لاتينية) — مثال: «رفح» أو «رفح، خان يونس».
 * القراءة عبر User::scopedGovernorates() التي تضمّ governorate إلى هذه القائمة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'extra_governorates')) {
                $table->string('extra_governorates')->nullable()->after('governorate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'extra_governorates')) {
                $table->dropColumn('extra_governorates');
            }
        });
    }
};
