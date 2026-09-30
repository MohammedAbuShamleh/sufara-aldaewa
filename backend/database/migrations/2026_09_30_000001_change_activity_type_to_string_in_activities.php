<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * activity_type أُنشئ ENUM بالأنواع التسعة الأولى، فرفضت MySQL (في الوضع
 * الصارم) كل نوع جديد بخطأ 1265 «Data truncated» — وهكذا تعطّل حفظ
 * «الحلقات العلمية» (scientific_circle) على الإنتاج وحده، بينما مرّ محلياً
 * لأن SQLite لا تفرض ENUM.
 *
 * نحوّله إلى نصّ عادي: القيم المسموحة محكومة أصلاً في تحقّق ActivityController،
 * فلا يلزم تعديل البنية عند إضافة أي نوع لاحق. القيم المخزّنة لا تتغيّر.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('activity_type')->change();
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->enum('activity_type', [
                'preaching_lesson',
                'scientific_lesson',
                'scientific_circle',
                'sermon',
                'tour',
                'forum',
                'media',
                'visit',
                'reform',
                'other',
            ])->change();
        });
    }
};
