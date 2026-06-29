<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\User;
use App\Models\Activity;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        // فلترة حسب الشهر والسنة (افتراضياً: الشهر الحالي)
        $month = $request->input('month', (int) date('n'));
        $year = $request->input('year', (int) date('Y'));

        // نبدأ من كل الدعاة (وليس من النماذج) ليظهر الجميع حتى من لم يُدخل نموذجاً
        $usersQuery = User::where('role', 'preacher');

        if ($request->filled('preacher_name')) {
            $usersQuery->where('name', 'like', '%' . $request->preacher_name . '%');
        }

        if ($request->filled('sub_region')) {
            $usersQuery->where('region', 'like', '%' . $request->sub_region . '%');
        }

        $users = $usersQuery->orderBy('name')->get();

        // نماذج الشهر المطلوب مع أنشطتها، مفهرسة بمعرّف الداعية
        $forms = Form::with('activities')
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->keyBy('user_id');

        $summary = $users->map(function ($user) use ($forms) {
            $form = $forms->get($user->id);
            $activities = $form ? $form->activities : collect();

            return [
                'form_id' => $form?->id,
                'user_id' => $user->id,
                'preacher_name' => $form?->preacher_name ?: $user->name,
                'sub_region' => $form?->sub_region ?: $user->region,
                'governorate' => $user->governorate,
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
        });

        return response()->json($summary->values());
    }
}
