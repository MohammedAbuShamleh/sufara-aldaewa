<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * سجل ردود المستخدمين على «عقد عمل مؤقت لكفالة داعية / طالب علم».
 *
 * كل صف = ردّ إلكتروني واحد لمستخدم على نسخة محددة من العقد:
 *  - decision = agreed   → وافق (توقيع إلكتروني مُلزم)
 *  - decision = declined → لم يوافق
 * ومن لا صفّ له لم يردّ بعد.
 *
 * تُحفظ لحظة الرد وعنوان الـ IP والمتصفح لأغراض الإثبات. لا يُحذف الصف عند تغيير
 * نص العقد؛ تُصدر نسخة جديدة (version) فيُطلب الرد عليها من جديد ويبقى الرد
 * القديم محفوظاً للسجل.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('contract_responses')) {
            return;
        }

        Schema::create('contract_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('contract_version');
            // agreed | declined — يسمح للمستخدم بالعدول عن رفضه لاحقاً بالموافقة
            $table->string('decision')->default('agreed');
            // dateTime لا timestamp: عمود timestamp في MySQL/MariaDB يلتقط ضمنياً
            // «ON UPDATE CURRENT_TIMESTAMP» فيُعاد كتابة لحظة الرد مع أي تحديث للصف،
            // وهذا يفسد قيمته كسجل إثبات.
            $table->dateTime('responded_at');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            // ردّ واحد لكل مستخدم لكل نسخة — يجعل تسجيل الرد عملية idempotent
            $table->unique(['user_id', 'contract_version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_responses');
    }
};
