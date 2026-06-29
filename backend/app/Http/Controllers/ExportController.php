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
    public function export(Form $form): BinaryFileResponse
    {
        return Excel::download(new ActivitiesExport($form), 'activities_' . $form->id . '.xlsx');
    }

    public function exportAll(Request $request): BinaryFileResponse
    {
        $filters = [
            'preacher_name' => $request->get('preacher_name'),
            'sub_region' => $request->get('sub_region'),
            'program_type' => $request->get('program_type'),
        ];
        
        $filename = 'all_activities_' . date('Y-m-d_His') . '.xlsx';
        
        return Excel::download(new AllFormsExport($filters), $filename);
    }
}
