<?php

namespace App\Exports;

use App\Models\Form;
use App\Models\Activity;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class ActivitiesExport implements WithMultipleSheets
{
    protected $form;

    public function __construct(Form $form)
    {
        $this->form = $form->load('activities');
    }

    public function sheets(): array
    {
        return [
            new ActivitiesDetailSheet($this->form),
            new ActivitiesSummarySheet($this->form),
        ];
    }
}

class ActivitiesDetailSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $form;

    public function __construct(Form $form)
    {
        $this->form = $form->load('activities');
    }

    public function collection()
    {
        return $this->form->activities;
    }

    public function headings(): array
    {
        return [
            'نوع النشاط',
            'تاريخ التنفيذ',
            'تفاصيل النشاط',
            'الجهة المستهدفة',
            'مكان التنفيذ',
            'عدد المستفيدين',
            'مسؤول الجولة',
            'مسؤول التنسيق',
        ];
    }

    public function map($activity): array
    {
        $types = Activity::getActivityTypes();
        
        return [
            $types[$activity->activity_type] ?? $activity->activity_type,
            $activity->execution_date->format('Y-m-d'),
            $activity->details,
            $activity->target_audience ?? '',
            $activity->location ?? '',
            $activity->beneficiaries_count ?? 0,
            $activity->tour_responsible ?? '',
            $activity->coordination_responsible ?? '',
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
        return 'الأنشطة التفصيلية';
    }
}

class ActivitiesSummarySheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $form;

    public function __construct(Form $form)
    {
        $this->form = $form->load('activities');
    }

    public function collection()
    {
        $activities = $this->form->activities;
        $summary = [
            [
                'label' => 'اسم الداعية',
                'value' => $this->form->preacher_name,
            ],
            [
                'label' => 'المنطقة الفرعية',
                'value' => $this->form->sub_region ?? '',
            ],
            [
                'label' => 'عدد الدروس الوعظية',
                'value' => $activities->where('activity_type', 'preaching_lesson')->count(),
            ],
            [
                'label' => 'عدد الدروس العلمية',
                'value' => $activities->where('activity_type', 'scientific_lesson')->count(),
            ],
            [
                'label' => 'عدد الخطب',
                'value' => $activities->where('activity_type', 'sermon')->count(),
            ],
            [
                'label' => 'عدد الجولات',
                'value' => $activities->where('activity_type', 'tour')->count(),
            ],
            [
                'label' => 'عدد الملتقيات',
                'value' => $activities->where('activity_type', 'forum')->count(),
            ],
            [
                'label' => 'عدد الأنشطة الإعلامية',
                'value' => $activities->where('activity_type', 'media')->count(),
            ],
            [
                'label' => 'عدد الزيارات',
                'value' => $activities->where('activity_type', 'visit')->count(),
            ],
            [
                'label' => 'عدد أنشطة الإصلاح',
                'value' => $activities->where('activity_type', 'reform')->count(),
            ],
            [
                'label' => 'عدد الأنشطة الأخرى',
                'value' => $activities->where('activity_type', 'other')->count(),
            ],
        ];

        return collect($summary);
    }

    public function headings(): array
    {
        return [
            'البند',
            'القيمة',
        ];
    }

    public function map($item): array
    {
        return [
            $item['label'],
            $item['value'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
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
        ];
    }

    public function title(): string
    {
        return 'الملخص الإجمالي';
    }
}

