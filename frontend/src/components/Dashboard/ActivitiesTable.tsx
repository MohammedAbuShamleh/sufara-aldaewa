import '../../styles/theme.css'

interface FormSummary {
  form_id: number
  preacher_name: string
  sub_region: string
  created_at: string
  summary: {
    preaching_lessons: number
    scientific_lessons: number
    sermons: number
    project_musalla_sermons: number
    tours: number
    forums: number
    media: number
    visits: number
    reform: number
    other: number
  }
}

interface Props {
  summaries: FormSummary[]
  onExport: (formId: number) => void
  onDelete: (formId: number) => void
}

function ActivitiesTable({ summaries, onExport, onDelete }: Props) {
  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-400 font-semibold text-sm">لا توجد بيانات لهذا الشهر</p>
        <p className="text-xs text-slate-300 mt-1">جرّب اختيار شهر مختلف</p>
      </div>
    )
  }

  const COLUMN_COLORS = [
    '#0d9488', '#0891b2', '#7c3aed', '#9333ea', '#2563eb',
    '#c026d3', '#ea580c', '#16a34a', '#ca8a04', '#64748b',
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
              <th className="py-3.5 px-4 text-right text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">اسم الداعية</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الوعظية</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">العلمية</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الخطب</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap" title="خطب في مصليات سفراء الدعوة">
                خطب مصليات المشروع
              </th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الجولات</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الملتقيات</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الإعلامية</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الزيارات</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الإصلاح</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">أخرى</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {summaries.map((summary) => {
              const counts = [
                summary.summary.preaching_lessons,
                summary.summary.scientific_lessons,
                summary.summary.sermons,
                summary.summary.project_musalla_sermons ?? 0,
                summary.summary.tours,
                summary.summary.forums,
                summary.summary.media,
                summary.summary.visits,
                summary.summary.reform,
                summary.summary.other,
              ]
              return (
                <tr key={summary.form_id} className="hover:bg-teal-50/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                    {summary.preacher_name}
                  </td>
                  {counts.map((count, i) => (
                    <td key={i} className="py-3 px-4 text-center">
                      {count > 0 ? (
                        <span
                          className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: COLUMN_COLORS[i] }}
                        >
                          {count}
                        </span>
                      ) : (
                        <span className="text-slate-200 text-xs">—</span>
                      )}
                    </td>
                  ))}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        className="p-1.5 rounded-lg bg-teal/10 text-teal hover:bg-teal hover:text-white transition-all"
                        onClick={() => onExport(summary.form_id)}
                        title="تصدير"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        className="p-1.5 rounded-lg bg-coral/10 text-coral hover:bg-coral hover:text-white transition-all"
                        onClick={() => onDelete(summary.form_id)}
                        title="حذف"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ActivitiesTable
