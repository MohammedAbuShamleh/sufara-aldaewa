<?php

namespace App\Services;

use App\Models\Form;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * المصدر الوحيد لملخّص التقارير الشهري (صف لكل داعية).
 *
 * تستخدمه كلٌّ من DashboardController::summary و AllFormsExport (ورقة "الملخص الشهري")
 * حتى لا يفترقا: نفس النطاق، نفس الفلاتر، ونفس الأعمدة — ويشمل الدعاة الذين لم
 * يُدخلوا نموذجاً هذا الشهر (وهو جوهر التقرير: من لم يُسلّم).
 */
class PreacherReportService
{
    /**
     * @param  array  $filters  month, year, governorate, sub_region, team, program_type, preacher_name
     * @return Collection<int, array>  صف لكل داعية بنفس شكل مخرجات لوحة التحكم
     */
    public function summary(User $viewer, array $filters = []): Collection
    {
        $month = (int) ($filters['month'] ?? date('n'));
        $year = (int) ($filters['year'] ?? date('Y'));

        $subRegion = $filters['sub_region'] ?? null;

        // نبدأ من المستخدمين ضمن نطاق العارض، مع تحميل الصفات مسبقاً
        // (الصفات طبقة تصنيف فقط، لا تؤثر على النطاق).
        $usersQuery = User::query()
            ->with('tags')
            ->visibleToViewer($viewer);

        if (! empty($subRegion)) {
            // عند تصفية "منطقة فرعية": نعرض كامل روستر المنطقة — كل من ينتمي إليها سواء
            // بمنطقته المسجّلة (users.region) أو بمنطقة نموذجٍ عبّأه (forms.sub_region) —
            // بغضّ النظر عن الدور أو التسليم، ليتطابق تماماً مع فلتر "المنطقة" في إدارة
            // المستخدمين. حالة التسليم لكلٍّ تُحسب لاحقاً بشكل مستقل (has_form).
            $usersQuery->where(function ($q) use ($subRegion) {
                $q->where('region', $subRegion)
                    ->orWhereHas('forms', fn ($f) => $f->where('sub_region', $subRegion));
            });
        } else {
            // الوضع الافتراضي (بلا تصفية منطقة): الدعاة المشمولون بالتقارير:
            //  - من دوره "داعية" (يظهر حتى لو لم يُسلّم نموذجاً)، أو
            //  - أي مستخدم عبّأ نموذج هذا الشهر (بأي دور) — فيظهر أصحاب الدور الإداري.
            $usersQuery->reportable($month, $year);
        }

        // فلترة اختيارية حسب الصفة (tag) — الدعاة الذين يحملون الصفة المطلوبة
        if (! empty($filters['tag_id'])) {
            $tagId = (int) $filters['tag_id'];
            $usersQuery->whereHas('tags', fn ($q) => $q->where('tags.id', $tagId));
        }

        if (! empty($filters['preacher_name'])) {
            $usersQuery->where('name', 'like', '%' . $filters['preacher_name'] . '%');
        }

        if (! empty($filters['governorate'])) {
            $usersQuery->where('governorate', $filters['governorate']);
        }

        // (تُطبَّق تصفية المنطقة الفرعية أعلاه على مستوى الروستر — انظر بناء $usersQuery.)

        // الفريق (users.region): فلتر منفصل تماماً عن المنطقة الفرعية
        if (! empty($filters['team'])) {
            $usersQuery->where('region', $filters['team']);
        }

        if (! empty($filters['program_type'])) {
            $usersQuery->where('program_type', $filters['program_type']);
        }

        $users = $usersQuery->orderBy('name')->get();

        // نماذج الشهر المطلوب (مقيّدة بنطاق العارض) مفهرسة بمعرّف الداعية
        $forms = Form::with('activities')
            ->visibleTo($viewer)
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->keyBy('user_id');

        return $users->map(function ($user) use ($forms) {
            $form = $forms->get($user->id);
            $activities = $form ? $form->activities : collect();

            return [
                'form_id' => $form?->id,
                'user_id' => $user->id,
                'preacher_name' => $form?->preacher_name ?: $user->name,
                'sub_region' => $form?->sub_region ?: $user->region,
                'governorate' => $user->governorate,
                'program_type' => $user->program_type,
                'administrative_title' => $user->administrative_title,
                'tags' => $user->tagsArray(),
                'has_form' => (bool) $form,
                'created_at' => $form?->created_at,
                'summary' => [
                    'preaching_lessons' => $activities->where('activity_type', 'preaching_lesson')->count(),
                    'scientific_lessons' => $activities->where('activity_type', 'scientific_lesson')->count(),
                    'sermons' => $activities->where('activity_type', 'sermon')->count(),
                    'project_musalla_sermons' => $activities->where('activity_type', 'sermon')->where('is_project_musalla', true)->count(),
                    'tours' => $activities->where('activity_type', 'tour')->count(),
                    'forums' => $activities->where('activity_type', 'forum')->count(),
                    'media' => $activities->where('activity_type', 'media')->count(),
                    'visits' => $activities->where('activity_type', 'visit')->count(),
                    'reform' => $activities->where('activity_type', 'reform')->count(),
                    'other' => $activities->where('activity_type', 'other')->count(),
                ],
            ];
        })->values();
    }

    /** ترتيب أنواع الأنشطة العشرة كما تظهر في الجدول والتصدير. */
    public const COUNTER_KEYS = [
        'preaching_lessons',
        'scientific_lessons',
        'sermons',
        'project_musalla_sermons',
        'tours',
        'forums',
        'media',
        'visits',
        'reform',
        'other',
    ];
}
