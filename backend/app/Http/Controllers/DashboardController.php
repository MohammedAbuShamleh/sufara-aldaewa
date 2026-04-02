<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\Activity;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $query = Form::with('activities');

        // فلترة حسب الشهر والسنة (افتراضياً: الشهر الحالي)
        $month = $request->input('month', (int) date('n'));
        $year = $request->input('year', (int) date('Y'));
        $query->where('month', $month)->where('year', $year);

        if ($request->has('preacher_name')) {
            $query->where('preacher_name', 'like', '%' . $request->preacher_name . '%');
        }

        if ($request->has('sub_region')) {
            $query->where('sub_region', 'like', '%' . $request->sub_region . '%');
        }

        $forms = $query->get();

        $summary = $forms->map(function ($form) {
            $activities = $form->activities;
            
            return [
                'form_id' => $form->id,
                'preacher_name' => $form->preacher_name,
                'sub_region' => $form->sub_region,
                'created_at' => $form->created_at,
                'summary' => [
                    'preaching_lessons' => $activities->where('activity_type', 'preaching_lesson')->count(),
                    'scientific_lessons' => $activities->where('activity_type', 'scientific_lesson')->count(),
                    'sermons' => $activities->where('activity_type', 'sermon')->count(),
                    'tours' => $activities->where('activity_type', 'tour')->count(),
                    'forums' => $activities->where('activity_type', 'forum')->count(),
                    'media' => $activities->where('activity_type', 'media')->count(),
                    'visits' => $activities->where('activity_type', 'visit')->count(),
                    'reform' => $activities->where('activity_type', 'reform')->count(),
                    'other' => $activities->where('activity_type', 'other')->count(),
                ],
            ];
        });

        return response()->json($summary);
    }
}
