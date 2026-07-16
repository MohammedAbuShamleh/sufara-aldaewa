<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Exports\ActivitiesExport;
use App\Exports\AllFormsExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function export(Request $request, Form $form): BinaryFileResponse
    {
        $user = $request->user();

        // تصدير نموذج مفرد: يجب أن يقع ضمن نطاق رؤية العارض
        if (! $user || ! $user->canViewReports() || ! $form->isVisibleTo($user)) {
            abort(403, 'غير مصرّح بتصدير هذا التقرير');
        }

        return Excel::download(new ActivitiesExport($form), 'activities_' . $form->id . '.xlsx');
    }

    public function exportAll(Request $request): BinaryFileResponse
    {
        $user = $request->user();
        if (! $user || ! $user->canViewReports()) {
            abort(403, 'غير مصرّح بتصدير التقارير');
        }

        $filters = [
            'preacher_name' => $request->get('preacher_name'),
            'sub_region' => $request->get('sub_region'),
            'team' => $request->get('team'),
            'governorate' => $request->get('governorate'),
            'program_type' => $request->get('program_type'),
            'tag_id' => $request->get('tag_id'),
            'month' => $request->get('month'),
            'year' => $request->get('year'),
        ];

        $filename = 'all_activities_' . date('Y-m-d_His') . '.xlsx';

        // نمرّر العارض حتى يُقيَّد التصدير بنطاق صلاحياته (نفس نطاق القائمة)
        return Excel::download(new AllFormsExport($filters, $user), $filename);
    }
}
