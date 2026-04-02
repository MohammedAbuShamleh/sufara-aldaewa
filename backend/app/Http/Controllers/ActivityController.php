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
            'activity_type' => 'required|in:preaching_lesson,scientific_lesson,sermon,tour,forum,media,visit,reform,other',
            'execution_date' => 'nullable|date',
            'details' => 'required|string',
            'target_audience' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'beneficiaries_count' => 'nullable|integer|min:0',
            'tour_responsible' => 'nullable|string|max:255',
            'coordination_responsible' => 'nullable|string|max:255',
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
            'activity_type' => 'sometimes|in:preaching_lesson,scientific_lesson,sermon,tour,forum,media,visit,reform,other',
            'execution_date' => 'sometimes|date',
            'details' => 'sometimes|string',
            'target_audience' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'beneficiaries_count' => 'nullable|integer|min:0',
            'tour_responsible' => 'nullable|string|max:255',
            'coordination_responsible' => 'nullable|string|max:255',
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
            'activities.*.activity_type' => 'required|in:preaching_lesson,scientific_lesson,sermon,tour,forum,media,visit,reform,other',
            'activities.*.execution_date' => 'nullable|date',
            'activities.*.details' => 'required|string',
            'activities.*.target_audience' => 'nullable|string|max:255',
            'activities.*.location' => 'nullable|string|max:255',
            'activities.*.beneficiaries_count' => 'nullable|integer|min:0',
            'activities.*.tour_responsible' => 'nullable|string|max:255',
            'activities.*.coordination_responsible' => 'nullable|string|max:255',
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
