import { programLabel } from '../../constants/programs'
import { type Tag } from '../../constants/tags'
import { TagChips } from './TagsSelect'
import '../../styles/theme.css'

interface FormSummary {
  form_id: number | null
  user_id?: number
  preacher_name: string
  sub_region: string
  governorate: string | null
  program_type?: string | null
  administrative_title?: string | null
  is_active?: boolean
  tags?: Tag[]
  has_form?: boolean
  created_at: string | null
  summary: {
    preaching_lessons: number
    scientific_lessons: number
    scientific_circles: number
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
  canDelete?: boolean
}

// ظلّ خفيف على يسار العمود المثبّت (الاسم على اليمين في RTL) للإشارة إلى الفصل
const STICKY_SHADOW = 'shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)]'

function countsOf(s: FormSummary): number[] {
  return [
    s.summary.preaching_lessons,
    s.summary.scientific_lessons,
    s.summary.scientific_circles ?? 0,
    s.summary.sermons,
    s.summary.project_musalla_sermons ?? 0,
    s.summary.tours,
    s.summary.forums,
    s.summary.media,
    s.summary.visits,
    s.summary.reform,
    s.summary.other,
  ].map((v) => v ?? 0)
}

function ActivitiesTable({ summaries, onExport, onDelete, canDelete = true }: Props) {
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

  // بترتيب countsOf نفسه: الوعظية، العلمية، الحلقات العلمية، الخطب، خطب المصليات،
  // الجولات، الملتقيات، الإعلامية، الزيارات، الإصلاح، أخرى
  const COLUMN_COLORS = [
    '#0d9488', '#0891b2', '#0e7490', '#7c3aed', '#9333ea', '#2563eb',
    '#c026d3', '#ea580c', '#16a34a', '#ca8a04', '#64748b',
  ]

  // مجاميع كل عمود + الإجمالي الكلي لصف التذييل
  // (الطول مشتقّ من countsOf حتى لا ينكسر الصف عند إضافة نوع نشاط جديد)
  const columnTotals = new Array(COLUMN_COLORS.length).fill(0)
  summaries.forEach((s) => {
    countsOf(s).forEach((v, i) => { columnTotals[i] += v })
  })
  const grandTotal = columnTotals.reduce((a, b) => a + b, 0)

  const counterTh =
    'py-3.5 px-2 w-12 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap'

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
              <th className={`sticky right-0 z-20 bg-slate-800 border-l border-white/10 ${STICKY_SHADOW} py-3.5 px-4 text-right text-xs font-bold text-white/90 tracking-wider whitespace-nowrap`}>
                الاسم
              </th>
              <th className="py-3.5 px-4 text-right text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">المحافظة</th>
              <th className="py-3.5 px-4 text-right text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">البرنامج</th>
              <th className="py-3.5 px-4 text-right text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الصفات</th>
              <th className="py-3.5 px-3 text-center text-xs font-bold text-white tracking-wider whitespace-nowrap bg-white/5">الإجمالي</th>
              <th className={counterTh}>الوعظية</th>
              <th className={counterTh}>العلمية</th>
              <th className={counterTh} title="الحلقات العلمية — مراقي العلم">الحلقات العلمية</th>
              <th className={counterTh}>الخطب</th>
              <th className={counterTh} title="خطب في مصليات سفراء الدعوة">خطب مصليات المشروع</th>
              <th className={counterTh}>الجولات</th>
              <th className={counterTh}>الملتقيات</th>
              <th className={counterTh}>الإعلامية</th>
              <th className={counterTh}>الزيارات</th>
              <th className={counterTh}>الإصلاح</th>
              <th className={counterTh}>أخرى</th>
              <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 tracking-wider whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {summaries.map((summary) => {
              const counts = countsOf(summary)
              const totalActivities = counts.reduce((a, b) => a + b, 0)
              const noForm = summary.has_form === false || summary.form_id == null
              const isEmpty = totalActivities === 0
              const needsAttention = noForm || isEmpty
              // خلفية معتمة للخلية المثبّتة (يجب ألّا تكون شفافة حتى لا تظهر الأعمدة المنزلقة تحتها)
              const stickyBg = needsAttention
                ? 'bg-amber-50 group-hover:bg-amber-100'
                : 'bg-white group-hover:bg-teal-50'
              return (
                <tr
                  key={summary.user_id ?? summary.form_id ?? summary.preacher_name}
                  className={`group transition-colors ${
                    needsAttention ? 'bg-amber-50/70 hover:bg-amber-100/70' : 'hover:bg-teal-50/40'
                  }`}
                >
                  <td className={`sticky right-0 z-10 ${stickyBg} border-l border-slate-200 ${STICKY_SHADOW} py-3 px-4 whitespace-nowrap`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{summary.preacher_name}</span>
                      {noForm ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 whitespace-nowrap">
                          لم يُدخل النموذج
                        </span>
                      ) : isEmpty ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-300 whitespace-nowrap">
                          نموذج فارغ
                        </span>
                      ) : null}
                      {summary.is_active === false && (
                        <span
                          title="حساب معطّل — لا يستطيع الدخول، وبياناته محفوظة"
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap"
                        >
                          معطّل
                        </span>
                      )}
                    </div>
                    {summary.administrative_title && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{summary.administrative_title}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {summary.governorate || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {summary.program_type ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal/10 text-teal border border-teal/20">
                        {programLabel(summary.program_type)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <TagChips tags={summary.tags} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    {totalActivities > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r from-teal to-cyan shadow-sm">
                        {totalActivities}
                      </span>
                    ) : (
                      <span className="text-slate-200 text-xs">—</span>
                    )}
                  </td>
                  {counts.map((count, i) => (
                    <td key={i} className="py-3 px-2 w-12 text-center">
                      {count > 0 ? (
                        <span
                          className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-bold text-white"
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
                    {summary.form_id != null ? (
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          className="p-1.5 rounded-lg bg-teal/10 text-teal hover:bg-teal hover:text-white transition-all"
                          onClick={() => onExport(summary.form_id as number)}
                          title="تصدير"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        {canDelete && (
                          <button
                            className="p-1.5 rounded-lg bg-coral/10 text-coral hover:bg-coral hover:text-white transition-all"
                            onClick={() => onDelete(summary.form_id as number)}
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-slate-300 text-xs">—</div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-200 font-bold text-slate-700">
              <td className={`sticky right-0 z-10 bg-slate-100 border-l border-slate-200 ${STICKY_SHADOW} py-3 px-4 whitespace-nowrap`}>
                الإجمالي
              </td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-3 text-center">
                <span className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-lg text-xs font-extrabold text-white bg-slate-800 shadow-sm">
                  {grandTotal}
                </span>
              </td>
              {columnTotals.map((t, i) => (
                <td key={i} className="py-3 px-2 w-12 text-center text-xs font-bold text-slate-600">
                  {t}
                </td>
              ))}
              <td className="py-3 px-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default ActivitiesTable
