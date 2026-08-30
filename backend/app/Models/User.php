<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // الأدوار
    public const ROLE_ADMIN = 'admin';                             // أدمن النظام
    public const ROLE_ADMIN_SECRETARY = 'admin_secretary';         // السكرتير / الإداري
    public const ROLE_CENTRAL_MANAGER = 'central_manager';         // مسؤول مركزي
    public const ROLE_GOVERNORATE_MANAGER = 'governorate_manager'; // مسؤول المحافظة
    public const ROLE_TEAM_LEADER = 'team_leader';                 // مسؤول فريق
    public const ROLE_PREACHER = 'preacher';                       // داعية

    /** الأدوار التي ترى كل التقارير في كل المحافظات. */
    public const ALL_REPORTS_ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_ADMIN_SECRETARY,
        self::ROLE_CENTRAL_MANAGER,
    ];

    /** الأدوار التي يحق لها فتح لوحة التقارير (بنطاق ما). */
    public const REPORT_VIEWER_ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_ADMIN_SECRETARY,
        self::ROLE_CENTRAL_MANAGER,
        self::ROLE_GOVERNORATE_MANAGER,
        self::ROLE_TEAM_LEADER,
    ];

    /** جميع الأدوار المسموح إسنادها من واجهة إدارة المستخدمين. */
    public const ASSIGNABLE_ROLES = [
        self::ROLE_PREACHER,
        self::ROLE_TEAM_LEADER,
        self::ROLE_GOVERNORATE_MANAGER,
        self::ROLE_CENTRAL_MANAGER,
        self::ROLE_ADMIN_SECRETARY,
        self::ROLE_ADMIN,
    ];

    /**
     * الأسماء العربية للأدوار — مصدر واحد يخدم استيراد الإكسيل ونموذجه.
     * يطابق ROLE_OPTIONS في الواجهة (frontend/src/constants/roles.ts).
     */
    public const ROLE_LABELS = [
        self::ROLE_PREACHER => 'داعية',
        self::ROLE_TEAM_LEADER => 'مسؤول فريق',
        self::ROLE_GOVERNORATE_MANAGER => 'مسؤول المحافظة',
        self::ROLE_CENTRAL_MANAGER => 'مسؤول مركزي',
        self::ROLE_ADMIN_SECRETARY => 'السكرتير / الإداري',
        self::ROLE_ADMIN => 'أدمن',
    ];

    /**
     * يحوّل ما يكتبه المستخدم في خانة «الدور» إلى قيمة الدور المخزّنة.
     *
     * يقبل الاسم العربي كما في النموذج، أو المفتاح الإنجليزي (preacher…)،
     * ويتسامح مع فروق المسافات وصيغ الهمزة الشائعة في الكتابة اليدوية.
     * يُعيد null إن لم يتعرّف على القيمة، فيتولّى المستدعي التحذير.
     */
    public static function roleFromLabel(?string $value): ?string
    {
        $normalized = self::normalizeArabic((string) $value);

        if ($normalized === '') {
            return null;
        }

        // المفتاح الإنجليزي كما هو مخزَّن (preacher, team_leader…)
        if (in_array($normalized, self::ASSIGNABLE_ROLES, true)) {
            return $normalized;
        }

        foreach (self::ROLE_LABELS as $role => $label) {
            if (self::normalizeArabic($label) === $normalized) {
                return $role;
            }
        }

        return null;
    }

    /**
     * تسوية نصّ عربي للمقارنة: توحيد الهمزات والألف المقصورة والتاء المربوطة،
     * وإزالة التشكيل والمسافات الزائدة. بدونها يفشل «مسؤول» أمام «مسئول».
     */
    public static function normalizeArabic(string $value): string
    {
        $value = trim(mb_strtolower($value));
        $value = preg_replace('/[\x{064B}-\x{0652}\x{0640}]/u', '', $value) ?? $value;
        // كراسي الهمزة تُحذف بدل أن تُردّ كلٌّ إلى حرفها: ردّ «ؤ» إلى «و»
        // و«ئ» إلى «ي» يجعل «مسؤول» و«مسئول» نصّين مختلفين، وهما الصيغتان
        // اللتان يكتبهما الناس فعلاً للكلمة نفسها.
        $value = strtr($value, [
            'أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا',
            'ؤ' => '', 'ئ' => '', 'ء' => '',
            'ى' => 'ي', 'ة' => 'ه',
        ]);

        return trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
    }

    protected $fillable = [
        'name',
        'email',
        'password',
        'id_number',
        'region',
        'governorate',
        'extra_governorates',
        'program_type',
        'administrative_title',
        'role',
        'is_active',
        'disabled_at',
        'notes',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'disabled_at' => 'datetime',
        ];
    }

    public function forms()
    {
        return $this->hasMany(Form::class);
    }

    /**
     * صفات التصنيف (Tags) — طبقة تصنيف متعددة لأغراض الفرز والفلترة فقط.
     * لا تمنح أي صلاحية؛ الرؤية محكومة بالدور (role) وحده.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /** الصفات كمصفوفة [{id, name}] للاستجابات (تعتمد التحميل المسبق إن وُجد). */
    public function tagsArray(): array
    {
        return $this->tags->map(fn ($tag) => [
            'id' => $tag->id,
            'name' => $tag->name,
        ])->values()->all();
    }

    // ── عقد الكفالة الإلكتروني ────────────────────────────────

    /** حالات المستخدم تجاه النسخة الحالية من العقد. */
    public const CONTRACT_PENDING = 'pending';   // لم يردّ بعد

    /** كل ردود المستخدم على نسخ العقد (سجل إثبات تراكمي). */
    public function contractResponses(): HasMany
    {
        return $this->hasMany(ContractResponse::class);
    }

    /** ردّ المستخدم على النسخة الحالية من العقد إن وُجد (يستفيد من التحميل المسبق). */
    public function currentContractResponse(?string $version = null): ?ContractResponse
    {
        $version ??= (string) config('contract.version');

        return $this->contractResponses
            ->firstWhere('contract_version', $version);
    }

    /** قرار المستخدم تجاه النسخة الحالية: agreed | declined | pending. */
    public function contractDecision(?string $version = null): string
    {
        return $this->currentContractResponse($version)?->decision ?? self::CONTRACT_PENDING;
    }

    /** هل وافق المستخدم على النسخة الحالية من العقد؟ (شرط دخول النظام) */
    public function hasAgreedToContract(?string $version = null): bool
    {
        return $this->contractDecision($version) === ContractResponse::DECISION_AGREED;
    }

    // ── تفعيل الحساب / تعطيله ─────────────────────────────────

    /**
     * هل الحساب فعّال؟ الحسابات القديمة (قبل إضافة العمود) تُعتبر فعّالة،
     * فلا يُقفل النظام في وجه الجميع إن لم تُنفَّذ الهجرة بعد.
     */
    public function isActive(): bool
    {
        return $this->is_active === null || (bool) $this->is_active;
    }

    /** قصر الاستعلام على الحسابات الفعّالة. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // ── الصلاحيات ─────────────────────────────────────────────

    /** هل يرى المستخدم كل التقارير في كل المحافظات؟ */
    public function canViewAllReports(): bool
    {
        return in_array($this->role, self::ALL_REPORTS_ROLES, true);
    }

    /** هل يحق للمستخدم فتح لوحة التقارير أصلاً (بأي نطاق)؟ */
    public function canViewReports(): bool
    {
        return in_array($this->role, self::REPORT_VIEWER_ROLES, true);
    }

    /** إدارة حسابات المستخدمين (إنشاء/تعديل/حذف) — للأدمن فقط. */
    public function canManageUsers(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * المحافظات التي يغطّيها هذا المستخدم كنطاق رؤية: محافظته الأساسية مضافاً
     * إليها ما في extra_governorates (لمن يغطّي أكثر من محافظة، كـ«الجنوب»).
     *
     * تقبل الفاصلة العربية واللاتينية، وتتجاهل الفراغات والقيم المكرّرة.
     * قائمة فارغة تعني «لا شيء» عمداً: whereIn على مصفوفة فارغة لا يُرجع صفوفاً،
     * فمسؤولٌ بلا محافظة لا يرى أحداً بدل أن يرى الجميع.
     *
     * @return list<string>
     */
    public function scopedGovernorates(): array
    {
        // المُعدِّل u ضروري: الفاصلة العربية «،» متعدّدة البايتات، وبدونه يقسم
        // preg_split على بايتات مفردة فيقطع الحروف العربية نفسها في المنتصف.
        $extra = preg_split('/[,،]/u', (string) $this->extra_governorates) ?: [];

        $all = array_map('trim', array_merge([(string) $this->governorate], $extra));

        return array_values(array_unique(array_filter($all, fn ($g) => $g !== '')));
    }

    /**
     * الدعاة المشمولون بالتقارير الشهرية:
     *  - كل من دوره "داعية" (يظهر حتى لو لم يُدخل نموذجاً — لرصد من لم يُسلّم)، أو
     *  - أي مستخدم عبّأ نموذجاً (بأي دور) — ليظهر الدعاة الذين لهم مسمى/دور إداري.
     * إن مُرِّر $month و $year قُيِّد وجود النموذج بذلك الشهر تحديداً؛ وإلا فأي نموذج.
     */
    public function scopeReportable(Builder $query, ?int $month = null, ?int $year = null): Builder
    {
        return $query->where(function (Builder $q) use ($month, $year) {
            $q->where('role', self::ROLE_PREACHER)
                ->orWhereHas('forms', function (Builder $fq) use ($month, $year) {
                    if ($month !== null && $year !== null) {
                        $fq->where('month', $month)->where('year', $year);
                    }
                });
        });
    }

    /**
     * تقييد استعلام على المستخدمين (الدعاة) إلى من يقع ضمن نطاق رؤية العارض.
     *  - أدوار "كل التقارير": بدون تقييد.
     *  - مسؤول المحافظة: نفس المحافظة.
     *  - مسؤول الفريق: نفس المحافظة + نفس الفريق (region).
     *  - غير ذلك (داعية): نفسه فقط.
     */
    public function scopeVisibleToViewer(Builder $query, User $viewer): Builder
    {
        if ($viewer->canViewAllReports()) {
            return $query;
        }

        if ($viewer->role === self::ROLE_GOVERNORATE_MANAGER) {
            return $query->whereIn('governorate', $viewer->scopedGovernorates());
        }

        if ($viewer->role === self::ROLE_TEAM_LEADER) {
            return $query
                ->where('governorate', $viewer->governorate)
                ->where('region', $viewer->region);
        }

        return $query->where('id', $viewer->id);
    }
}
