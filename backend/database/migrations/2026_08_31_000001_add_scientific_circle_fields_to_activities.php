<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * حقلان خاصّان بنشاط «الحلقات العلمية (مراقي العلم)»:
 *  - program_name: اسم البرنامج (النابغة الصغير / غرس البذور / تحصيل العلم / تأصيل العلم)
 *  - completed_amount: القدر المنجز (المواضيع المشروحة أو الصفحات) — نصّ حرّ لأن
 *    الوحدة تختلف بين برنامج وآخر.
 *
 * بقية حقول القسم تُعيد استخدام الأعمدة القائمة: اسم الكتاب في details،
 * وعدد الطلاب في beneficiaries_count، ومكان التنفيذ في location — فتبقى
 * المجاميع والتصدير متّسقة مع سائر الأنواع.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (! Schema::hasColumn('activities', 'program_name')) {
                $table->string('program_name')->nullable()->after('details');
            }
            if (! Schema::hasColumn('activities', 'completed_amount')) {
                $table->string('completed_amount')->nullable()->after('program_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['program_name', 'completed_amount']);
        });
    }
};
