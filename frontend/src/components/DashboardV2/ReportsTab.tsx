import { useState, useEffect, useCallback } from 'react'
import ReportsTable from './ReportsTable'
import api from '../../services/api'
import { PROGRAM_OPTIONS } from '../../constants/programs'
import { canViewAllReports } from '../../constants/roles'
import { useTags, type Tag } from '../../constants/tags'
import {
  FilterBar, MonthField, SearchField, SelectField, ToggleField, MONTH_NAMES,
} from './Field'
import { errorMessage } from './errors'

export interface FormSummary {
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

const STAT_META: { key: keyof FormSummary['summary']; label: string; color: string }[] = [
  { key: 'preaching_lessons', label: 'الدروس الوعظية', color: '#0f766e' },
  { key: 'scientific_lessons', label: 'الدروس العلمية', color: '#0891b2' },
  { key: 'scientific_circles', label: 'الحلقات العلمية', color: '#0e7490' },
  { key: 'sermons', label: 'الخطب', color: '#b45309' },
  { key: 'project_musalla_sermons', label: 'خطب المصليات', color: '#a16207' },
  { key: 'tours', label: 'الجولات', color: '#15803d' },
  { key: 'forums', label: 'المنتديات', color: '#7c3aed' },
  { key: 'media', label: 'الإعلامية', color: '#be185d' },
  { key: 'visits', label: 'الزيارات', color: '#0369a1' },
  { key: 'reform', label: 'الإصلاح', color: '#c2410c' },
  { key: 'other', label: 'أخرى', color: '#475569' },
]

/**
 * تبويب التقارير — نفس بيانات اللوحة الحالية وسلوكها، بشريط فلترة موحّد
 * وإحصاءات قابلة للطيّ حتى لا تدفع الجدول (وهو المطلوب فعلاً) خارج الشاشة.
 */
export default function ReportsTab({ role }: { role?: string }) {
  const [summaries, setSummaries] = useState<FormSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [statsOpen, setStatsOpen] = useState(
    () => localStorage.getItem('dashboard2:stats_open') !== '0',
  )

  const [filters, setFilters] = useState({
    preacher_name: '',
    governorate: '',
    sub_region: '',
    program_type: '',
    tag_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  // إظهار الحسابات المعطّلة — مخفيّة افتراضياً، والاختيار محفوظ بالمتصفح.
  const [includeDisabled, setIncludeDisabled] = useState(
    () => localStorage.getItem('dashboard:include_disabled') === '1',
  )

  const tags = useTags()
  const [governorateOptions, setGovernorateOptions] = useState<string[]>([])
  const [subRegionOptions, setSubRegionOptions] = useState<string[]>([])

  useEffect(() => {
    localStorage.setItem('dashboard:include_disabled', includeDisabled ? '1' : '0')
  }, [includeDisabled])

  useEffect(() => {
    localStorage.setItem('dashboard2:stats_open', statsOpen ? '1' : '0')
  }, [statsOpen])

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    params.append('month', filters.month.toString())
    params.append('year', filters.year.toString())
    if (filters.preacher_name) params.append('preacher_name', filters.preacher_name)
    if (filters.governorate) params.append('governorate', filters.governorate)
    if (filters.sub_region) params.append('sub_region', filters.sub_region)
    if (filters.program_type) params.append('program_type', filters.program_type)
    if (filters.tag_id) params.append('tag_id', filters.tag_id)
    if (includeDisabled) params.append('include_disabled', '1')
    return params
  }, [filters, includeDisabled])

  const loadSummaries = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`/dashboard/summary?${buildParams().toString()}`)
      setSummaries(response.data)
    } catch (err) {
      console.error('Error loading summaries:', err)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    loadSummaries()
  }, [loadSummaries])

  useEffect(() => {
    api.get('/dashboard/governorates')
      .then((res) => setGovernorateOptions(res.data))
      .catch((err) => console.error('Error loading governorates:', err))
  }, [])

  useEffect(() => {
    const params = filters.governorate ? `?governorate=${encodeURIComponent(filters.governorate)}` : ''
    api.get(`/dashboard/sub-regions${params}`)
      .then((res) => setSubRegionOptions(res.data))
      .catch((err) => console.error('Error loading sub-regions:', err))
  }, [filters.governorate])

  const handleExportAll = async () => {
    setExporting(true)
    try {
      const response = await api.get(`/export/excel-all?${buildParams().toString()}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `تقرير_${MONTH_NAMES[filters.month - 1]}_${filters.year}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleExport = async (formId: number) => {
    try {
      const response = await api.get(`/export/excel/${formId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `نموذج_${formId}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting form:', err)
    }
  }

  const handleDelete = async (formId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا النموذج وكل أنشطته؟')) return
    try {
      await api.delete(`/forms/${formId}`)
      loadSummaries()
    } catch (err) {
      alert(errorMessage(err, 'فشل حذف النموذج'))
    }
  }

  const activeCount = [
    filters.preacher_name, filters.governorate, filters.sub_region, filters.program_type, filters.tag_id,
  ].filter(Boolean).length + (includeDisabled ? 1 : 0)

  const clearFilters = () => {
    setFilters((f) => ({
      ...f, preacher_name: '', governorate: '', sub_region: '', program_type: '', tag_id: '',
    }))
    setIncludeDisabled(false)
  }

  const totals = STAT_META.map((stat) => ({
    ...stat,
    value: summaries.reduce((sum, s) => sum + (s.summary[stat.key] ?? 0), 0),
  }))
  const grandTotal = totals.reduce((sum, t) => sum + t.value, 0)
  const noFormCount = summaries.filter((s) => s.has_form === false || s.form_id == null).length
  const disabledShown = summaries.filter((s) => s.is_active === false).length

  return (
    <>
      <FilterBar
        activeCount={activeCount}
        onClear={clearFilters}
        resultLabel={
          <>
            {summaries.length} داعية — <span className="font-semibold text-amber-700">{noFormCount}</span> لم يُسلّم
            {disabledShown > 0 && <> — <span className="font-semibold text-slate-600">{disabledShown}</span> معطّل</>}
          </>
        }
      >
        <MonthField
          label="الشهر"
          month={filters.month}
          year={filters.year}
          onChange={(month, year) => setFilters((f) => ({ ...f, month, year }))}
        />
        <SearchField
          label="الاسم"
          value={filters.preacher_name}
          onChange={(v) => setFilters((f) => ({ ...f, preacher_name: v }))}
          placeholder="بحث بالاسم"
        />
        <SelectField
          label="المحافظة"
          value={filters.governorate}
          allLabel="كل المحافظات"
          options={governorateOptions.map((g) => ({ value: g, label: g }))}
          onChange={(v) => setFilters((f) => ({ ...f, governorate: v, sub_region: '' }))}
        />
        <SelectField
          label="المنطقة"
          value={filters.sub_region}
          allLabel="كل المناطق"
          options={subRegionOptions.map((r) => ({ value: r, label: r }))}
          onChange={(v) => setFilters((f) => ({ ...f, sub_region: v }))}
        />
        <SelectField
          label="البرنامج"
          value={filters.program_type}
          allLabel="كل البرامج"
          options={PROGRAM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => setFilters((f) => ({ ...f, program_type: v }))}
        />
        <SelectField
          label="الصفة"
          value={filters.tag_id}
          allLabel="كل الصفات"
          options={tags.map((t) => ({ value: String(t.id), label: t.name }))}
          onChange={(v) => setFilters((f) => ({ ...f, tag_id: v }))}
        />
        <ToggleField
          label="الحسابات المعطّلة"
          checked={includeDisabled}
          onChange={setIncludeDisabled}
          onLabel="ظاهرة"
          offLabel="مخفيّة"
          title={
            includeDisabled
              ? 'المعطّلون ظاهرون في الجدول والمجاميع والتصدير'
              : 'المعطّلون مخفيّون، عدا من عبّأ نموذجاً في الشهر المعروض'
          }
        />
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleExportAll}
            disabled={exporting}
            className="w-full h-11 px-3 rounded-xl bg-gradient-to-r from-teal to-cyan text-white text-sm font-bold shadow-lg shadow-teal/20 hover:shadow-xl disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </button>
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-darkGray font-medium">جاري التحميل...</p>
        </div>
      ) : (
        <>
          {/* الإحصاءات — قابلة للطيّ، فالجدول هو المقصود عادةً */}
          <div className="bg-white rounded-2xl border border-slate-200 mb-5 overflow-hidden">
            <button
              type="button"
              onClick={() => setStatsOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-bold text-darkGray whitespace-nowrap">
                  إحصائيات {MONTH_NAMES[filters.month - 1]} {filters.year}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-teal/10 text-teal text-sm font-black whitespace-nowrap">
                  {grandTotal} نشاط
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${statsOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {statsOpen && (
              <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {totals.map((stat) => (
                  <div
                    key={stat.key}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-center"
                  >
                    <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[11px] font-semibold text-slate-500 leading-tight mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-amber-200 border border-amber-300" />
              لم يُدخل النموذج هذا الشهر
            </span>
            {disabledShown > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block px-1.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
                  معطّل
                </span>
                {includeDisabled ? 'حساب معطّل' : 'حساب معطّل — ظاهر لأن له نموذجاً هذا الشهر'}
              </span>
            )}
          </div>

          <ReportsTable
            summaries={summaries}
            onExport={handleExport}
            onDelete={handleDelete}
            canDelete={canViewAllReports(role)}
          />
        </>
      )}
    </>
  )
}
