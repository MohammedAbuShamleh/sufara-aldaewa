<?php

namespace App\Exports;

use App\Models\Form;
use App\Models\Activity;
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

    public function __construct($filters = [])
    {
        $query = Form::with('activities');
        
        if (isset($filters['preacher_name']) && $filters['preacher_name']) {
            $query->where('preacher_name', 'like', '%' . $filters['preacher_name'] . '%');
        }
        
        if (isset($filters['sub_region']) && $filters['sub_region']) {
            $query->where('sub_region', 'like', '%' . $filters['sub_region'] . '%');
        }
        
        $this->forms = $query->orderBy('created_at', 'desc')->get();
    }

    public function sheets(): array
    {
        $sheets = [
            new AllFormsDetailSheet($this->forms),
            new AllFormsSummarySheet($this->forms),
        ];
        
        return $sheets;
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
            'نوع النشاط',
            'تاريخ التنفيذ',
            'تفاصيل النشاط',
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
            $types[$activity->activity_type] ?? $activity->activity_type,
            $activity->execution_date->format('Y-m-d'),
            $activity->details,
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
                'total' => $activities->count(),
            ];
        }
        
        // إضافة صف إجمالي
        $totalRow = [
            'preacher_name' => 'الإجمالي',
            'sub_region' => '',
            'preaching_lessons' => collect($summary)->sum('preaching_lessons'),
            'scientific_lessons' => collect($summary)->sum('scientific_lessons'),
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
            'الدروس الوعظية',
            'الدروس العلمية',
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
            $item['preaching_lessons'],
            $item['scientific_lessons'],
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

