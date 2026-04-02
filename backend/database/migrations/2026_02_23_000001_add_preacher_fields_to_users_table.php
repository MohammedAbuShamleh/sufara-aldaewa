<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('id_number')->nullable()->after('email');
            $table->string('region')->nullable()->after('id_number');
            $table->string('role')->default('preacher')->after('region'); // admin | preacher
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['id_number', 'region', 'role']);
        });
    }
};
