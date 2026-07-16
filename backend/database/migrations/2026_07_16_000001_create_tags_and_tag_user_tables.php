<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * طبقة التصنيف (الصفات / Tags) — تصنيفٌ متعدّد للمستخدمين لأغراض الفرز والفلترة
 * وأعمدة التقارير مستقبلاً. لا تمنح أي صلاحية إطلاقاً؛ الرؤية تبقى محكومة بالدور (role).
 *
 * - tags: قائمة الصفات (اسم فريد).
 * - tag_user: جدول ربط many-to-many بين المستخدمين والصفات (فريد لكل زوج، حذف متسلسل).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tags')) {
            Schema::create('tags', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('tag_user')) {
            Schema::create('tag_user', function (Blueprint $table) {
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
                $table->unique(['user_id', 'tag_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tag_user');
        Schema::dropIfExists('tags');
    }
};
