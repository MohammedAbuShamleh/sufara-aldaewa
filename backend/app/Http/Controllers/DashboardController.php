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

        $governorates = User::query()
            ->reportable()
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
     * المناطق المتاحة ضمن نطاق العارض (لملء قائمة الفلترة).
     *
     * تُجمع من مصدرين لأن المنطقة تُسجَّل في مكانين: على المستخدم (users.region)
     * وعلى النموذج (forms.sub_region). الاعتماد على النماذج وحدها كان يُخفي أي منطقة
     * لم يُسلّم أعضاؤها نماذج بعد — رغم أن التصفية عليها تعمل. الاتحاد هنا يطابق
     * منطق التصفية في PreacherReportService::summary.
     *
     * يمكن التقييد بمحافظة عبر ?governorate= (يُطبَّق على محافظة المستخدم في الحالتين).
     */
    public function subRegions(Request $request)
    {
        $viewer = $this->viewerOrAbort($request);
        $governorate = $request->filled('governorate') ? $request->governorate : null;

        // (أ) مناطق المستخدمين ضمن النطاق
        $fromUsers = User::query()
            ->visibleToViewer($viewer)
            ->whereNotNull('region')
            ->where('region', '!=', '')
            ->when($governorate, fn ($q) => $q->where('governorate', $governorate))
            ->distinct()
            ->pluck('region');

        // (ب) مناطق مكتوبة على النماذج ضمن النطاق
        $fromForms = Form::visibleTo($viewer)
            ->whereNotNull('sub_region')
            ->where('sub_region', '!=', '')
            ->when($governorate, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('governorate', $governorate)))
            ->distinct()
            ->pluck('sub_region');

        $subRegions = $fromUsers
            ->concat($fromForms)
            ->unique()
            ->sort(fn ($a, $b) => strcoll($a, $b))
            ->values();

        return response()->json($subRegions);
    }
}
