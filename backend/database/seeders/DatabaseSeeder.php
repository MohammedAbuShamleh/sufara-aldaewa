<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── صفات التصنيف (Tags) ──
        $this->call(TagSeeder::class);

        // ── أدمن النظام ──
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
            ]
        );

        // ── حسابات أدوار نموذجية (كلمة المرور: password، الدخول برقم الهوية) ──
        // أدوار "كل التقارير"
        $this->make('900000001', 'مدير مركزي', User::ROLE_CENTRAL_MANAGER, null, null, 'المدير المركزي');
        $this->make('900000002', 'السكرتير الإداري', User::ROLE_ADMIN_SECRETARY, null, null, 'السكرتير');

        // مسؤولو المحافظات (النطاق = المحافظة)
        $this->make('900000010', 'مسؤول محافظة غزة', User::ROLE_GOVERNORATE_MANAGER, 'غزة', null, 'مسؤول المحافظة');
        $this->make('900000011', 'مسؤول محافظة خان يونس', User::ROLE_GOVERNORATE_MANAGER, 'خان يونس', null, 'مسؤول المحافظة');

        // مسؤولو الفرق (النطاق = المحافظة + الفريق/المنطقة الفرعية)
        $this->make('900000020', 'مسؤول فريق شرق غزة', User::ROLE_TEAM_LEADER, 'غزة', 'شرق غزة - الدرج', 'مسؤول فريق');
        $this->make('900000021', 'مسؤول فريق دير البلح', User::ROLE_TEAM_LEADER, 'الوسطى', 'دير البلح', 'مسؤول فريق');

        // ── دعاة موزّعون لاختبار النطاق ──
        $this->make('100000001', 'داعية شرق غزة (أ)', User::ROLE_PREACHER, 'غزة', 'شرق غزة - الدرج', 'داعية', 'dawah');
        $this->make('100000002', 'داعية شرق غزة (ب)', User::ROLE_PREACHER, 'غزة', 'شرق غزة - الدرج', 'داعية', 'scientific');
        $this->make('100000003', 'داعية غرب غزة', User::ROLE_PREACHER, 'غزة', 'غرب غزة', 'داعية', 'dawah');
        $this->make('100000004', 'داعية القرارة', User::ROLE_PREACHER, 'خان يونس', 'القرارة', 'داعية', 'dawah');
        $this->make('100000005', 'داعية دير البلح', User::ROLE_PREACHER, 'الوسطى', 'دير البلح', 'داعية', 'scientific');
        $this->make('100000006', 'داعية النصيرات', User::ROLE_PREACHER, 'الوسطى', 'النصيرات', 'داعية', 'dawah');
    }

    private function make(
        string $idNumber,
        string $name,
        string $role,
        ?string $governorate = null,
        ?string $region = null,
        ?string $adminTitle = null,
        ?string $programType = null,
    ): void {
        User::updateOrCreate(
            ['id_number' => $idNumber],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'role' => $role,
                'governorate' => $governorate,
                'region' => $region,
                'administrative_title' => $adminTitle,
                'program_type' => $programType,
            ]
        );
    }
}
