import { useState, useEffect, useRef } from 'react'
import { programLabel } from '../../constants/programs'
import { TagChips } from '../Dashboard/TagsSelect'
import type { FormSummary } from './ReportsTab'

interface Props {
  summaries: FormSummary[]
  onExport: (formId: number) => void
  onDelete: (formId: number) => void
  canDelete?: boolean
}

/** ظلّ خفيف على يسار العمود المثبّت (الاسم على اليمين في RTL). */
const STICKY_SHADOW = 'shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)]'

/** أعمدة بيانات الداعية — وصفية، يحتاجها المستخدم أحياناً لا دائماً. */
const INFO_COLUMNS = [
  { key: 'governorate', label: 'المحافظة' },
  { key: 'sub_region', label: 'المنطقة' },
  { key: 'program_type', label: 'البرنامج' },
  { key: 'tags', label: 'الصفات' },
] as const

/** أعمدة أنواع الأنشطة العشرة — جوهر التقرير، بترتيب النموذج نفسه. */
const ACTIVITY_COLUMNS = [
  { key: 'preaching_lessons', label: 'الوعظية', color: '#0d9488' },
  { key: 'scientific_lessons', label: 'العلمية', color: '#0891b2' },
  { key: 'scientific_circles', label: 'الحلقات العلمية', color: '#0e7490', title: 'الحلقات العلمية — مراقي العلم' },
  { key: 'sermons', label: 'الخطب', color: '#7c3aed' },
  { key: 'project_musalla_sermons', label: 'خطب المصليات', color: '#9333ea', title: 'خطب في مصليات سفراء الدعوة' },
  { key: 'tours', label: 'الجولات', color: '#2563eb' },
  { key: 'forums', label: 'الملتقيات', color: '#c026d3' },
  { key: 'media', label: 'الإعلامية', color: '#ea580c' },
  { key: 'visits', label: 'الزيارات', color: '#16a34a' },
  { key: 'reform', label: 'الإصلاح', color: '#ca8a04' },
  { key: 'other', label: 'أخرى', color: '#64748b' },
] as const

type InfoKey = (typeof INFO_COLUMNS)[number]['key']
type ActivityKey = (typeof ACTIVITY_COLUMNS)[number]['key']

// v2: رُفع المفتاح عند إضافة عمود «الحلقات العلمية» — الاختيار المحفوظ قديماً
// لا يحوي العمود الجديد، فلولا الرفع لبقي مخفيّاً عمّن استخدم اللوحة سابقاً.
const STORAGE_KEY = 'dashboard2:report_columns:v2'

/** الافتراضي: المحافظة وحدها من الوصفية، وكل أنواع الأنشطة — أي ١٤ عموداً بدل ١٦. */
const DEFAULT_INFO: InfoKey[] = ['governorate']
const DEFAULT_ACTIVITIES: ActivityKey[] = ACTIVITY_COLUMNS.map((c) => c.key)

/** «مختصر»: الاسم والمحافظة والإجمالي فقط — للمسح السريع ومقارنة من سلّم ومن لم يُسلّم. */
const COMPACT_INFO: InfoKey[] = ['governorate']
const COMPACT_ACTIVITIES: ActivityKey[] = []

interface Saved {
  info: InfoKey[]
  activities: ActivityKey[]
}

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Saved
      if (Array.isArray(parsed.info) && Array.isArray(parsed.activities)) return parsed
    }
  } catch {
    /* قيمة تالفة في التخزين — نتجاهلها ونعود للافتراضي */
  }
  return { info: DEFAULT_INFO, activities: DEFAULT_ACTIVITIES }
}

/**
 * جدول التقارير — نفس بيانات الجدول الحالي، لكن أعمدته قابلة للاختيار.
 *
 * الجدول الحالي يعرض ستة عشر عموداً دفعةً واحدة (أربعة وصفية + الإجمالي + عشرة
 * أنواع أنشطة + الإجراءات)، فلا يُقرأ إلا بتمرير أفقي مستمر. هنا نفس الأعمدة
 * متاحة كلها، لكن المعروض منها اختيار المستخدم — ومحفوظ في متصفحه.
 *
 * عمود «الإجمالي» يجمع الأنواع العشرة كلها دائماً، حتى المخفيّ منها، حتى لا
 * يتغيّر رقم الداعية بتغيّر ما يُعرض.
 */
export default function ReportsTable({ summaries, onExport, onDelete, canDelete = true }: Props) {
  const [saved, setSaved] = useState<Saved>(loadSaved)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }, [saved])

  useEffect(() => {
    if (!pickerOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [pickerOpen])

  const visibleInfo = INFO_COLUMNS.filter((c) => saved.info.includes(c.key))
  const visibleActivities = ACTIVITY_COLUMNS.filter((c) => saved.activities.includes(c.key))
  const totalColumns = 2 + visibleInfo.length + visibleActivities.length + 1

  const toggleInfo = (key: InfoKey) =>
    setSaved((s) => ({
      ...s,
      info: s.info.includes(key) ? s.info.filter((k) => k !== key) : [...s.info, key],
    }))

  const toggleActivity = (key: ActivityKey) =>
    setSaved((s) => ({
      ...s,
      activities: s.activities.includes(key)
        ? s.activities.filter((k) => k !== key)
        : [...s.activities, key],
    }))

  const isCompact = saved.activities.length === 0
  const isFull = saved.info.length === INFO_COLUMNS.length && saved.activities.length === ACTIVITY_COLUMNS.length

  /** مجموع كل أنواع الأنشطة للداعية — لا يتأثر بما هو مخفيّ. */
  const totalOf = (s: FormSummary) =>
    ACTIVITY_COLUMNS.reduce((sum, c) => sum + (s.summary[c.key] ?? 0), 0)

  const grandTotal = summaries.reduce((sum, s) => sum + totalOf(s), 0)
  const columnTotals = visibleActivities.map((c) =>
    summaries.reduce((sum, s) => sum + (s.summary[c.key] ?? 0), 0),
  )

  const infoCellFor = (key: InfoKey, s: FormSummary) => {
    switch (key) {
      case 'governorate':
        return s.governorate || <span className="text-slate-300">—</span>
      case 'sub_region':
        return s.sub_region || <span className="text-slate-300">—</span>
      case 'program_type':
        return s.program_type ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal/10 text-teal border border-teal/20">
            {programLabel(s.program_type)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )
      case 'tags':
        return <TagChips tags={s.tags} />
    }
  }

  const presetBtn = (active: boolean) =>
    `px-3 h-9 rounded-lg text-xs font-bold border transition-all ${
      active ? 'bg-teal text-white border-teal' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`

  return (
    <div>
      {/* شريط التحكّم بالأعمدة */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-slate-400">العرض:</span>
        <button
          type="button"
          onClick={() => setSaved({ info: COMPACT_INFO, activities: COMPACT_ACTIVITIES })}
          className={presetBtn(isCompact)}
          title="الاسم والمحافظة والإجمالي فقط"
        >
          مختصر
        </button>
        <button
          type="button"
          onClick={() => setSaved({
            info: INFO_COLUMNS.map((c) => c.key),
            activities: ACTIVITY_COLUMNS.map((c) => c.key),
          })}
          className={presetBtn(isFull)}
          title="كل الأعمدة"
        >
          كامل
        </button>

        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="px-3 h-9 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            أعمدة ({totalColumns})
          </button>

          {pickerOpen && (
            <div className="absolute z-30 mt-1 right-0 w-64 max-h-96 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl py-2">
              <p className="px-3 pb-1.5 text-[11px] text-slate-400">
                الاسم والإجمالي والإجراءات ثابتة
              </p>

              <p className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-500">بيانات الداعية</p>
              {INFO_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-darkGray hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={saved.info.includes(col.key)}
                    onChange={() => toggleInfo(col.key)}
                    className="accent-teal"
                  />
                  {col.label}
                </label>
              ))}

              <div className="flex items-center justify-between px-3 pt-3 pb-1">
                <span className="text-[11px] font-bold text-slate-500">أنواع الأنشطة</span>
                <button
                  type="button"
                  onClick={() => setSaved((s) => ({
                    ...s,
                    activities: s.activities.length === ACTIVITY_COLUMNS.length
                      ? []
                      : ACTIVITY_COLUMNS.map((c) => c.key),
                  }))}
                  className="text-[11px] font-semibold text-teal hover:underline"
                >
                  {saved.activities.length === ACTIVITY_COLUMNS.length ? 'إلغاء الكل' : 'تحديد الكل'}
                </button>
              </div>
              {ACTIVITY_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-darkGray hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={saved.activities.includes(col.key)}
                    onChange={() => toggleActivity(col.key)}
                    className="accent-teal"
                  />
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-400 font-semibold text-sm">لا توجد بيانات لهذا الشهر</p>
          <p className="text-xs text-slate-300 mt-1">جرّب اختيار شهر مختلف</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <th className={`sticky right-0 z-20 bg-slate-800 border-l border-white/10 ${STICKY_SHADOW} py-3.5 px-4 text-right text-xs font-bold text-white/90 whitespace-nowrap`}>
                    الاسم
                  </th>
                  {visibleInfo.map((col) => (
                    <th key={col.key} className="py-3.5 px-4 text-right text-xs font-bold text-white/90 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th
                    className="py-3.5 px-3 text-center text-xs font-bold text-white whitespace-nowrap bg-white/5"
                    title="مجموع أنواع الأنشطة كلها، بما فيها الأعمدة المخفيّة"
                  >
                    الإجمالي
                  </th>
                  {visibleActivities.map((col) => (
                    <th
                      key={col.key}
                      title={'title' in col ? col.title : undefined}
                      className="py-3.5 px-2 w-12 text-center text-xs font-bold text-white/90 whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center text-xs font-bold text-white/90 whitespace-nowrap">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {summaries.map((summary) => {
                  const totalActivities = totalOf(summary)
                  const noForm = summary.has_form === false || summary.form_id == null
                  const isEmpty = totalActivities === 0
                  const needsAttention = noForm || isEmpty
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

                      {visibleInfo.map((col) => (
                        <td key={col.key} className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {infoCellFor(col.key, summary)}
                        </td>
                      ))}

                      <td className="py-3 px-3 text-center">
                        {totalActivities > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r from-teal to-cyan shadow-sm">
                            {totalActivities}
                          </span>
                        ) : (
                          <span className="text-slate-200 text-xs">—</span>
                        )}
                      </td>

                      {visibleActivities.map((col) => {
                        const count = summary.summary[col.key] ?? 0
                        return (
                          <td key={col.key} className="py-3 px-2 w-12 text-center">
                            {count > 0 ? (
                              <span
                                className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-bold text-white"
                                style={{ backgroundColor: col.color }}
                              >
                                {count}
                              </span>
                            ) : (
                              <span className="text-slate-200 text-xs">—</span>
                            )}
                          </td>
                        )
                      })}

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
                  {visibleInfo.map((col) => <td key={col.key} className="py-3 px-4" />)}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-lg text-xs font-extrabold text-white bg-slate-800 shadow-sm">
                      {grandTotal}
                    </span>
                  </td>
                  {columnTotals.map((total, i) => (
                    <td key={visibleActivities[i].key} className="py-3 px-2 w-12 text-center text-xs font-bold text-slate-600">
                      {total}
                    </td>
                  ))}
                  <td className="py-3 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
