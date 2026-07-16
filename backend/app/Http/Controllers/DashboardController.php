<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\User;
use App\Services\PreacherReportService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** يتحقق من أن العارض يحق له فتح لوحة التقارير، ويعيده. */
    private function viewerOrAbort(Request $request): User
    {
        $user = $request->user();
        if (! $user || ! $user->canViewReports()) {
            abort(403, 'غير مصرّح بعرض التقارير');
        }
        return $user;
    }

    public function summary(Request $request, PreacherReportService $reports)
    {
        $viewer = $this->viewerOrAbort($request);

        // مصدر واحد للملخّص يشترك فيه التصدير (لا يفترقان)
        $summary = $reports->summary($viewer, $request->all());

        return response()->json($summary);
    }

    /** المحافظات المتاحة ضمن نطاق العارض (لملء قائمة الفلترة). */
    public function governorates(Request $request)
    {
        $viewer = $this->viewerOrAbort($request);

        $governorates = User::where('role', User::ROLE_PREACHER)
            ->visibleToViewer($viewer)
            ->whereNotNull('governorate')
            ->where('governorate', '!=', '')
            ->distinct()
            ->orderBy('governorate')
            ->pluck('governorate')
            ->values();

        return response()->json($governorates);
    }

    /**
     * المناطق الفرعية (forms.sub_region) المتاحة ضمن نطاق العارض.
     * ملاحظة: المنطقة الفرعية حقلٌ جغرافي على النموذج (forms) وليست الفريق (users.region).
     * يمكن تقييدها إضافياً بمحافظة عبر ?governorate= (يُطبَّق على محافظة الداعية صاحب النموذج).
     */
    public function subRegions(Request $request)
    {
        $viewer = $this->viewerOrAbort($request);

        $query = Form::visibleTo($viewer)
            ->whereNotNull('sub_region')
            ->where('sub_region', '!=', '');

        if ($request->filled('governorate')) {
            $governorate = $request->governorate;
            $query->whereHas('user', fn ($q) => $q->where('governorate', $governorate));
        }

        $subRegions = $query->distinct()->orderBy('sub_region')->pluck('sub_region')->values();

        return response()->json($subRegions);
    }
}
