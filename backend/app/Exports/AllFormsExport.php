<?php

namespace App\Exports;

use App\Models\Form;
use App\Models\User;
use App\Models\Activity;
use App\Services\PreacherReportService;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class AllFormsExport implements WithMultipleSheets
{
    protected $forms;

    /** ملخّص صف-لكل-داعية (نفس مصدر لوحة التحكم) لورقة "الملخص الشهري". */
    protected $preacherSummary;

    public function __construct($filters = [], ?User $viewer = null)
    {
        // ورقة الملخص الشهري: نفس استعلام DashboardController::summary (صف لكل داعية،
        // ويشمل من لم يُدخل نموذجاً). فارغة إن لم يُمرَّر عارض.
        $this->preacherSummary = $viewer
            ? (new PreacherReportService())->summary($viewer, is_array($filters) ? $filters : [])
            : collect();

        $query = Form::with('activities', 'user');

        // تقييد بنطاق صلاحيات العارض (نفس نطاق قائمة التقارير)
        if ($viewer) {
            $query->visibleTo($viewer);
        }

        if (isset($filters['preacher_name']) && $filters['preacher_name']) {
            $query->where('preacher_name', 'like', '%' . $filters['preacher_name'] . '%');
        }

        // المنطقة الفرعية (forms.sub_region): مطابقة تامة على النموذج مباشرة
        if (isset($filters['sub_region']) && $filters['sub_region']) {
            $query->where('sub_region', $filters['sub_region']);
        }

        // الفريق (users.region): مطابقة تامة على بيانات الداعية — فلتر منفصل
        if (isset($filters['team']) && $filters['team']) {
            $query->whereHas('user', fn ($q) => $q->where('region', $filters['team']));
        }

        if (isset($filters['governorate']) && $filters['governorate']) {
            $query->whereHas('user', fn ($q) => $q->where('governorate', $filters['governorate']));
        }

        if (isset($filters['program_type']) && $filters['program_type']) {
            $query->whereHas('user', function ($q) use ($filters) {
                $q->where('program_type', $filters['program_type']);
            });
        }

        // مطابقة الشهر/السنة المعروضين في اللوحة عند تمريرهما
        if (isset($filters['month']) && $filters['month']) {
            $query->where('month', (int) $filters['month']);
        }
        if (isset($filters['year']) && $filters['year']) {
            $query->where('year', (int) $filters['year']);
        }

        $this->forms = $query->orderBy('created_at', 'desc')->get();
    }

    public static function programLabel(?string $type): string
    {
        return match ($type) {
            'scientific' => 'البرنامج العلمي',
            'dawah' => 'البرنامج الدعوي',
            'joint' => 'البرنامج المشترك',
            default => '',
        };
    }

    public function sheets(): array
    {
        // الملخص الشهري أولاً — وهو ما ينظر إليه المشرفون (يشمل من لم يُسلّم)
        return [
            new MonthlyPreacherSummarySheet($this->preacherSummary),
            new AllFormsDetailSheet($this->forms),
            new AllFormsSummarySheet($this->forms),
        ];
    }
}

/**
 * ورقة "الملخص الشهري": صف لكل داعية (وليس لكل نموذج)، مطابقة لجدول الشاشة،
 * وتشمل الدعاة الذين لم يُدخلوا نموذجاً هذا الشهر مع تمييزهم بلون أصفر.
 */
class MonthlyPreacherSummarySheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $summary;
    /** أرقام صفوف الشيت (1-based) التي تحتاج تمييزاً (لم يُدخل النموذج / نموذج فارغ). */
    protected array $attentionRows = [];
    protected int $totalsRow = 1;

    public function __construct(Collection $summary)
    {
        $this->summary = $summary;
    }

    public function collection()
    {
        $rows = [];
        $this->attentionRows = []; // idempotent: قد تُستدعى مرتين (البيانات + التنسيق)
        $colTotals = array_fill(0, count(PreacherReportService::COUNTER_KEYS), 0);
        $sheetRow = 2; // الصف 1 للعناوين

        foreach ($this->summary as $item) {
            $s = $item['summary'];
            $counts = array_map(fn ($k) => (int) ($s[$k] ?? 0), PreacherReportService::COUNTER_KEYS);
            $total = array_sum($counts);

            if (! $item['has_form']) {
                $status = 'لم يُدخل النموذج';
            } elseif ($total === 0) {
                $status = 'نموذج فارغ (بدون أنشطة)';
            } else {
                $status = 'مكتمل';
            }

            if (! $item['has_form'] || $total === 0) {
                $this->attentionRows[] = $sheetRow;
            }

            $tagNames = collect($item['tags'] ?? [])->pluck('name')->implode('، ');

            $rows[] = array_merge(
                [
                    $item['preacher_name'],
                    $item['governorate'] ?? '',
                    $item['administrative_title'] ?? '',
                    $tagNames,
                    AllFormsExport::programLabel($item['program_type'] ?? null),
                    $status,
                ],
                $counts,
                [$total]
            );

            foreach ($counts as $i => $c) {
                $colTotals[$i] += $c;
            }
            $sheetRow++;
        }

        // صف الإجماليات
        $this->totalsRow = $sheetRow;
        $rows[] = array_merge(
            ['الإجمالي', '', '', '', '', ''],
            $colTotals,
            [array_sum($colTotals)]
        );

        return collect($rows);
    }

    public function headings(): array
    {
        return [
            'الاسم',
            'المحافظة',
            'المسمى الإداري',
            'الصفات',
            'البرنامج',
            'الحالة',
            'الوعظية',
            'العلمية',
            'الحلقات العلمية',
            'الخطب',
            'خطب مصليات المشروع',
            'الجولات',
            'الملتقيات',
            'الإعلامية',
            'الزيارات',
            'الإصلاح',
            'أخرى',
            'الإجمالي',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // نضمن حساب صفوف التمييز/الإجمالي قبل التنسيق
        if ($this->totalsRow === 1) {
            $this->collection();
        }

        // تمييز صفوف عدم التسليم/الفراغ بلون أصفر فاتح (كما في الواجهة)
        foreach ($this->attentionRows as $r) {
            $sheet->getStyle("A{$r}:Q{$r}")->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FEF3C7'],
                ],
            ]);
        }

        // صف الإجماليات
        $sheet->getStyle("A{$this->totalsRow}:Q{$this->totalsRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E8E8E'],
            ],
        ]);

        // صف العناوين
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '334155'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'الملخص الشهري';
    }
}

class AllFormsDetailSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $forms;

    public function __construct($forms)
    {
        $this->forms = $forms;
    }

    public function collection()
    {
        $allActivities = collect();
        
        foreach ($this->forms as $form) {
            foreach ($form->activities as $activity) {
                $allActivities->push([
                    'form_id' => $form->id,
                    'preacher_name' => $form->preacher_name,
                    'sub_region' => $form->sub_region,
                    'governorate' => $form->user?->governorate,
                    'program_type' => $form->user?->program_type,
                    'administrative_title' => $form->user?->administrative_title,
                    'activity' => $activity,
                ]);
            }
        }
        
        return $allActivities;
    }

    public function headings(): array
    {
        return [
            'اسم الداعية',
            'المنطقة الفرعية',
            'المحافظة',
            'البرنامج',
            'المسمى الإداري',
            'نوع النشاط',
            'تاريخ التنفيذ',
            'تفاصيل النشاط / اسم الكتاب',
            'اسم البرنامج',
            'القدر المنجز',
            'الجهة المستهدفة',
            'مكان التنفيذ',
            'عدد المستفيدين',
            'مسؤول الجولة',
            'مسؤول التنسيق',
            'خطبة في مصلى المشروع',
        ];
    }

    public function map($item): array
    {
        $activity = $item['activity'];
        $types = Activity::getActivityTypes();

        return [
            $item['preacher_name'],
            $item['sub_region'] ?? '',
            $item['governorate'] ?? '',
            AllFormsExport::programLabel($item['program_type'] ?? null),
            $item['administrative_title'] ?? '',
            $types[$activity->activity_type] ?? $activity->activity_type,
            $activity->execution_date->format('Y-m-d'),
            $activity->details,
            $activity->program_name ?? '',
            $activity->completed_amount ?? '',
            $activity->target_audience ?? '',
            $activity->location ?? '',
            $activity->beneficiaries_count ?? 0,
            $activity->tour_responsible ?? '',
            $activity->coordination_responsible ?? '',
            ($activity->activity_type === 'sermon' && $activity->is_project_musalla) ? 'نعم' : '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '1E8E8E'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'جميع الأنشطة التفصيلية';
    }
}

class AllFormsSummarySheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $forms;

    public function __construct($forms)
    {
        $this->forms = $forms;
    }

    public function collection()
    {
        $summary = [];
        
        foreach ($this->forms as $form) {
            $activities = $form->activities;
            $summary[] = [
                'preacher_name' => $form->preacher_name,
                'sub_region' => $form->sub_region ?? '',
                'governorate' => $form->user?->governorate ?? '',
                'program_type' => AllFormsExport::programLabel($form->user?->program_type),
                'administrative_title' => $form->user?->administrative_title ?? '',
                'preaching_lessons' => $activities->where('activity_type', 'preaching_lesson')->count(),
                'scientific_lessons' => $activities->where('activity_type', 'scientific_lesson')->count(),
                'scientific_circles' => $activities->where('activity_type', 'scientific_circle')->count(),
                'sermons' => $activities->where('activity_type', 'sermon')->count(),
                'project_musalla_sermons' => $activities->where('activity_type', 'sermon')->where('is_project_musalla', true)->count(),
                'tours' => $activities->where('activity_type', 'tour')->count(),
                'forums' => $activities->where('activity_type', 'forum')->count(),
                'media' => $activities->where('activity_type', 'media')->count(),
                'visits' => $activities->where('activity_type', 'visit')->count(),
                'reform' => $activities->where('activity_type', 'reform')->count(),
                'other' => $activities->where('activity_type', 'other')->count(),
                'total' => $activities->count(),
            ];
        }
        
        // إضافة صف إجمالي
        $totalRow = [
            'preacher_name' => 'الإجمالي',
            'sub_region' => '',
            'governorate' => '',
            'program_type' => '',
            'administrative_title' => '',
            'preaching_lessons' => collect($summary)->sum('preaching_lessons'),
            'scientific_lessons' => collect($summary)->sum('scientific_lessons'),
            'scientific_circles' => collect($summary)->sum('scientific_circles'),
            'sermons' => collect($summary)->sum('sermons'),
            'project_musalla_sermons' => collect($summary)->sum('project_musalla_sermons'),
            'tours' => collect($summary)->sum('tours'),
            'forums' => collect($summary)->sum('forums'),
            'media' => collect($summary)->sum('media'),
            'visits' => collect($summary)->sum('visits'),
            'reform' => collect($summary)->sum('reform'),
            'other' => collect($summary)->sum('other'),
            'total' => collect($summary)->sum('total'),
        ];
        $summary[] = $totalRow;
        
        return collect($summary);
    }

    public function headings(): array
    {
        return [
            'اسم الداعية',
            'المنطقة الفرعية',
            'المحافظة',
            'البرنامج',
            'المسمى الإداري',
            'الدروس الوعظية',
            'الدروس العلمية',
            'الحلقات العلمية',
            'الخطب',
            'منها في مصليات المشروع',
            'الجولات',
            'الملتقيات',
            'الأنشطة الإعلامية',
            'الزيارات',
            'الإصلاح',
            'أخرى',
            'الإجمالي',
        ];
    }

    public function map($item): array
    {
        return [
            $item['preacher_name'],
            $item['sub_region'],
            $item['governorate'],
            $item['program_type'],
            $item['administrative_title'],
            $item['preaching_lessons'],
            $item['scientific_lessons'],
            $item['scientific_circles'],
            $item['sermons'],
            $item['project_musalla_sermons'],
            $item['tours'],
            $item['forums'],
            $item['media'],
            $item['visits'],
            $item['reform'],
            $item['other'],
            $item['total'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $this->collection()->count();
        
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'B18A2D'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ],
            $lastRow => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '1E8E8E'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'الملخص الإجمالي';
    }
}

