<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * تعطيل المستخدمين بدل حذفهم.
 *
 * الحذف يُفقد سجل الداعية ونماذجه وأنشطته من التقارير؛ التعطيل يمنعه من الدخول
 * ويُبقي بياناته التاريخية كما هي.
 *
 * - is_active: هل يُسمح للحساب بالدخول؟ (الافتراضي: نعم — كل الحسابات القائمة تبقى فعّالة)
 * - disabled_at: لحظة التعطيل، لعرضها في كشف الإدارة (تُمسح عند إعادة التفعيل)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('role');
            }
            if (! Schema::hasColumn('users', 'disabled_at')) {
                $table->timestamp('disabled_at')->nullable()->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['disabled_at', 'is_active'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
