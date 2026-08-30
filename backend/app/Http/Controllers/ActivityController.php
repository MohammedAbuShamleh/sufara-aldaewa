<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Form;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    private function ensureFormOwnership(Request $request, int $formId): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        $form = Form::find($formId);
        if (!$form) {
            return false;
        }
        return $form->user_id === $user->id || $user->role === 'admin';
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Activity::with('form');

        if ($request->has('form_id')) {
            $formId = (int) $request->form_id;
            if (!$this->ensureFormOwnership($request, $formId)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $query->where('form_id', $formId);
        } else {
            // بدون تحديد نموذج: قيّد النتائج بنطاق رؤية الطالب حتى لا تُسرَّب أنشطة
            // الدعاة خارج نطاقه (كان الاستعلام يُعيد كل الأنشطة في النظام).
            $query->whereHas('form', fn ($q) => $q->visibleTo($user));
        }

        if ($request->has('activity_type')) {
            $query->where('activity_type', $request->activity_type);
        }

        $activities = $query->orderBy('execution_date', 'desc')->get();

        return response()->json($activities);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'form_id' => 'required|exists:forms,id',
            'activity_type' => 'required|in:preaching_lesson,scientific_lesson,scientific_circle,sermon,tour,forum,media,visit,reform,other',
            'execution_date' => 'nullable|date',
            'details' => 'required|string',
            'program_name' => 'nullable|string|max:255',
            'completed_amount' => 'nullable|string|max:255',
            'target_audience' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'beneficiaries_count' => 'nullable|integer|min:0',
            'tour_responsible' => 'nullable|string|max:255',
            'coordination_responsible' => 'nullable|string|max:255',
            'is_project_musalla' => 'nullable|boolean',
        ]);

        if (!$this->ensureFormOwnership($request, (int) $validated['form_id'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $activity = Activity::create($validated);

        return response()->json($activity->load('form'), 201);
    }

    public function show(Activity $activity)
    {
        return response()->json($activity->load('form'));
    }

    public function update(Request $request, Activity $activity)
    {
        if (!$this->ensureFormOwnership($request, (int) $activity->form_id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'form_id' => 'sometimes|exists:forms,id',
            'activity_type' => 'sometimes|in:preaching_lesson,scientific_lesson,scientific_circle,sermon,tour,forum,media,visit,reform,other',
            'execution_date' => 'sometimes|date',
            'details' => 'sometimes|string',
            'program_name' => 'nullable|string|max:255',
            'completed_amount' => 'nullable|string|max:255',
            'target_audience' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'beneficiaries_count' => 'nullable|integer|min:0',
            'tour_responsible' => 'nullable|string|max:255',
            'coordination_responsible' => 'nullable|string|max:255',
            'is_project_musalla' => 'nullable|boolean',
        ]);

        $activity->update($validated);

        return response()->json($activity->load('form'));
    }

    public function destroy(Request $request, Activity $activity)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (!$this->ensureFormOwnership($request, (int) $activity->form_id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $activity->delete();
        return response()->json(['message' => 'Activity deleted successfully']);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'form_id' => 'required|exists:forms,id',
            'activities' => 'required|array',
            'activities.*.activity_type' => 'required|in:preaching_lesson,scientific_lesson,scientific_circle,sermon,tour,forum,media,visit,reform,other',
            'activities.*.execution_date' => 'nullable|date',
            'activities.*.details' => 'required|string',
            'activities.*.program_name' => 'nullable|string|max:255',
            'activities.*.completed_amount' => 'nullable|string|max:255',
            'activities.*.target_audience' => 'nullable|string|max:255',
            'activities.*.location' => 'nullable|string|max:255',
            'activities.*.beneficiaries_count' => 'nullable|integer|min:0',
            'activities.*.tour_responsible' => 'nullable|string|max:255',
            'activities.*.coordination_responsible' => 'nullable|string|max:255',
            'activities.*.is_project_musalla' => 'nullable|boolean',
        ]);

        $activities = [];
        foreach ($validated['activities'] as $activityData) {
            $activities[] = Activity::create([
                'form_id' => $validated['form_id'],
                ...$activityData,
            ]);
        }

        return response()->json($activities, 201);
    }
}
