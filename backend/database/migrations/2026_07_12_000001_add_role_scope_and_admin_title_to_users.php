<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * الأدوار والصلاحيات المبنية على النطاق (المحافظة / الفريق).
 *
 * ملاحظات على نموذج البيانات:
 * - العمود role موجود مسبقاً (preacher | admin). هذه الهجرة توسّع القيم المسموحة
 *   لتشمل: team_leader | governorate_manager | central_manager | admin_secretary.
 * - العمود governorate موجود مسبقاً (المحافظة).
 * - العمود region يمثّل "الفريق / المنطقة الفرعية" ويُستخدم كنطاق لمسؤول الفريق.
 *   لا نضيف عموداً جديداً باسم team لأنه يكرّر region الموجود والمعبّأ فعلاً.
 *
 * الجديد هنا: administrative_title (المسمى الإداري).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'administrative_title')) {
                $table->string('administrative_title')->nullable()->after('program_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'administrative_title')) {
                $table->dropColumn('administrative_title');
            }
        });
    }
};
