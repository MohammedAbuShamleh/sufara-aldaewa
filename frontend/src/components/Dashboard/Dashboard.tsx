import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Layout/Header'
import ActivitiesTable from './ActivitiesTable'
import UsersSection from './UsersSection'
import ContractStatusSection from './ContractStatusSection'
import api from '../../services/api'
import { useAuth } from '../../services/auth'
import { PROGRAM_OPTIONS } from '../../constants/programs'
import { canManageUsers, canViewAllReports } from '../../constants/roles'
import { useTags, type Tag } from '../../constants/tags'
import '../../styles/theme.css'

interface FormSummary {
  form_id: number | null
  user_id?: number
  preacher_name: string
  sub_region: string
  governorate: string | null
  program_type?: string | null
  administrative_title?: string | null
  tags?: Tag[]
  has_form?: boolean
  created_at: string | null
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

function Dashboard() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<FormSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    preacher_name: '',
    sub_region: '',
    governorate: '',
    program_type: '',
    tag_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const tags = useTags()

  // خيارات الفلترة تأتي من الخادم مقيّدة بنطاق صلاحيات المستخدم
  const [governorateOptions, setGovernorateOptions] = useState<string[]>([])
  const [subRegionOptions, setSubRegionOptions] = useState<string[]>([])

  const [govDropdownOpen, setGovDropdownOpen] = useState(false)
  const govDropdownRef = useRef<HTMLDivElement>(null)
  const [subRegionDropdownOpen, setSubRegionDropdownOpen] = useState(false)
  const subRegionDropdownRef = useRef<HTMLDivElement>(null)

  const MONTH_NAMES = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ]
  const navigate = useNavigate()

  const isAdmin = canManageUsers(user?.role)
  const canDelete = canViewAllReports(user?.role)

  useEffect(() => {
    loadSummaries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // قائمة المحافظات المتاحة ضمن نطاق المستخدم (تُحمّل مرة واحدة)
  useEffect(() => {
    api.get('/dashboard/governorates')
      .then((res) => setGovernorateOptions(res.data))
      .catch((err) => console.error('Error loading governorates:', err))
  }, [])

  // قائمة المناطق الفرعية (forms.sub_region) — مقيّدة بالمحافظة المختارة إن وُجدت
  useEffect(() => {
    const params = filters.governorate ? `?governorate=${encodeURIComponent(filters.governorate)}` : ''
    api.get(`/dashboard/sub-regions${params}`)
      .then((res) => {
        setSubRegionOptions(res.data)
        // إن لم تعد المنطقة الفرعية المختارة ضمن الخيارات المتاحة، صفّرها
        setFilters((f) => (f.sub_region && !res.data.includes(f.sub_region) ? { ...f, sub_region: '' } : f))
      })
      .catch((err) => console.error('Error loading sub-regions:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.governorate])

  // إغلاق القوائم المنسدلة عند الضغط خارجها
  useEffect(() => {
    if (!govDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (govDropdownRef.current && !govDropdownRef.current.contains(e.target as Node)) {
        setGovDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [govDropdownOpen])

  useEffect(() => {
    if (!subRegionDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (subRegionDropdownRef.current && !subRegionDropdownRef.current.contains(e.target as Node)) {
        setSubRegionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [subRegionDropdownOpen])

  const buildParams = () => {
    const params = new URLSearchParams()
    params.append('month', filters.month.toString())
    params.append('year', filters.year.toString())
    if (filters.preacher_name) params.append('preacher_name', filters.preacher_name)
    if (filters.governorate) params.append('governorate', filters.governorate)
    if (filters.sub_region) params.append('sub_region', filters.sub_region)
    if (filters.program_type) params.append('program_type', filters.program_type)
    if (filters.tag_id) params.append('tag_id', filters.tag_id)
    return params
  }

  const loadSummaries = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/dashboard/summary?${buildParams().toString()}`)
      setSummaries(response.data)
    } catch (error) {
      console.error('Error loading summaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (formId: number) => {
    try {
      const response = await api.get(`/export/excel/${formId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `activities_${formId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting:', error)
      alert('حدث خطأ أثناء التصدير')
    }
  }

  const handleDelete = async (formId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاستبيان؟')) return
    try {
      await api.delete(`/forms/${formId}`)
      loadSummaries()
    } catch (error) {
      console.error('Error deleting form:', error)
      alert('حدث خطأ أثناء الحذف')
    }
  }

  // تصدير المجموعة المعروضة حالياً (يحترم نطاق الصلاحيات وكل الفلاتر)
  const handleExportAll = async () => {
    try {
      const response = await api.get(`/export/excel-all?${buildParams().toString()}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `all_activities_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting all:', error)
      alert('حدث خطأ أثناء التصدير')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lightGray via-white to-lightGray ">
      <Header />
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gold  drop-shadow-sm">
              لوحة التحكم
            </h2>
            <p className="text-sm md:text-base text-darkGray/70 mt-1">
              إدارة ومتابعة جميع الأنشطة الدعوية
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal to-cyan text-white hover:from-teal/90 hover:to-cyan/90 transition-all duration-300 font-semibold shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 flex items-center gap-2"
              onClick={handleExportAll}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تصدير النتائج المعروضة
            </button>
            <button
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-white hover:from-gold/90 hover:to-yellow-500/90 transition-all duration-300 font-semibold shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40 flex items-center gap-2"
              onClick={() => navigate('/form')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              نموذج جديد
            </button>
          </div>
        </div>

        {isAdmin && <ContractStatusSection />}

        {isAdmin && <UsersSection />}

        <div className="bg-white rounded-2xl shadow-xl border border-teal/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-xl font-bold text-teal">فلترة البيانات</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="form-group">
              <label className="block text-sm font-semibold text-darkGray mb-2">
                الشهر
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    let m = filters.month - 1
                    let y = filters.year
                    if (m < 1) { m = 12; y-- }
                    setFilters({ ...filters, month: m, year: y })
                  }}
                  className="px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-teal hover:text-white hover:border-teal transition-all text-lg font-bold"
                >
                  ›
                </button>
                <div className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray font-semibold">
                  {MONTH_NAMES[filters.month - 1]} {filters.year}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    let m = filters.month + 1
                    let y = filters.year
                    if (m > 12) { m = 1; y++ }
                    setFilters({ ...filters, month: m, year: y })
                  }}
                  className="px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-teal hover:text-white hover:border-teal transition-all text-lg font-bold"
                >
                  ‹
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="block text-sm font-semibold text-darkGray mb-2">
                اسم الداعية
              </label>
              <input
                type="text"
                value={filters.preacher_name}
                onChange={(e) => setFilters({ ...filters, preacher_name: e.target.value })}
                placeholder="ابحث باسم الداعية"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray focus:ring-2 focus:ring-teal focus:border-teal transition-all"
              />
            </div>

            {/* فلتر المحافظة — من الخادم، مقيّد بالنطاق */}
            <div className="form-group">
              <label className="block text-sm font-semibold text-darkGray mb-2">
                المحافظة
              </label>
              <div className="relative" ref={govDropdownRef}>
                <button
                  type="button"
                  onClick={() => setGovDropdownOpen((o) => !o)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border text-right transition-all ${
                    filters.governorate
                      ? 'border-teal bg-teal/10 text-teal font-semibold'
                      : 'border-gray-300 bg-lightBlueGray text-darkGray hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{filters.governorate || 'كل المحافظات'}</span>
                  <svg className={`w-4 h-4 shrink-0 transition-transform ${govDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {govDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((f) => ({ ...f, governorate: '', sub_region: '' }))
                        setGovDropdownOpen(false)
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                        filters.governorate === '' ? 'text-teal font-semibold' : 'text-darkGray'
                      }`}
                    >
                      كل المحافظات
                    </button>
                    {governorateOptions.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-darkGray/60">لا توجد محافظات</p>
                    ) : (
                      governorateOptions.map((gov) => (
                        <button
                          key={gov}
                          type="button"
                          onClick={() => {
                            setFilters((f) => ({ ...f, governorate: gov, sub_region: '' }))
                            setGovDropdownOpen(false)
                          }}
                          className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                            filters.governorate === gov ? 'text-teal font-semibold' : 'text-darkGray'
                          }`}
                        >
                          {gov}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* فلتر المنطقة الفرعية (forms.sub_region) — من الخادم، مقيّد بالنطاق والمحافظة */}
            <div className="form-group">
              <label className="block text-sm font-semibold text-darkGray mb-2">
                المنطقة الفرعية
              </label>
              <div className="relative" ref={subRegionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSubRegionDropdownOpen((o) => !o)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border text-right transition-all ${
                    filters.sub_region
                      ? 'border-teal bg-teal/10 text-teal font-semibold'
                      : 'border-gray-300 bg-lightBlueGray text-darkGray hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{filters.sub_region || 'كل المناطق'}</span>
                  <svg className={`w-4 h-4 shrink-0 transition-transform ${subRegionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {subRegionDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((f) => ({ ...f, sub_region: '' }))
                        setSubRegionDropdownOpen(false)
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                        filters.sub_region === '' ? 'text-teal font-semibold' : 'text-darkGray'
                      }`}
                    >
                      كل المناطق
                    </button>
                    {subRegionOptions.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-darkGray/60">لا توجد مناطق</p>
                    ) : (
                      subRegionOptions.map((sr) => (
                        <button
                          key={sr}
                          type="button"
                          onClick={() => {
                            setFilters((f) => ({ ...f, sub_region: sr }))
                            setSubRegionDropdownOpen(false)
                          }}
                          className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                            filters.sub_region === sr ? 'text-teal font-semibold' : 'text-darkGray'
                          }`}
                        >
                          {sr}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-semibold text-darkGray mb-2">
                البرنامج
              </label>
              <select
                value={filters.program_type}
                onChange={(e) => setFilters({ ...filters, program_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray focus:ring-2 focus:ring-teal focus:border-teal transition-all"
              >
                <option value="">كل البرامج</option>
                {PROGRAM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* فلتر الصفة (Tag) — تصنيف فقط، لا يؤثر على النطاق */}
            <div className="form-group">
              <label className="block text-sm font-semibold text-darkGray mb-2">
                الصفة
              </label>
              <select
                value={filters.tag_id}
                onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray focus:ring-2 focus:ring-teal focus:border-teal transition-all"
              >
                <option value="">كل الصفات</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
              <p className="text-darkGray font-medium">جاري التحميل...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── إحصائيات عامة للشهر ── */}
            <div className="bg-white rounded-2xl shadow-xl border border-teal/10 p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-xl font-bold text-teal">
                    إحصائيات {MONTH_NAMES[filters.month - 1]} {filters.year}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-teal/10 text-teal text-sm font-semibold">
                  {summaries.length} داعية
                </span>
              </div>

              {(() => {
                const totals = {
                  preaching_lessons: 0, scientific_lessons: 0, sermons: 0, project_musalla_sermons: 0,
                  tours: 0, forums: 0, media: 0, visits: 0, reform: 0, other: 0,
                }
                summaries.forEach(s => {
                  totals.preaching_lessons += s.summary.preaching_lessons
                  totals.scientific_lessons += s.summary.scientific_lessons
                  totals.sermons += s.summary.sermons
                  totals.project_musalla_sermons += s.summary.project_musalla_sermons ?? 0
                  totals.tours += s.summary.tours
                  totals.forums += s.summary.forums
                  totals.media += s.summary.media
                  totals.visits += s.summary.visits
                  totals.reform += s.summary.reform
                  totals.other += s.summary.other
                })
                const grandTotal =
                  totals.preaching_lessons + totals.scientific_lessons + totals.sermons +
                  totals.tours + totals.forums + totals.media + totals.visits + totals.reform + totals.other

                const STATS = [
                  { label: 'الدروس الوعظية', value: totals.preaching_lessons, color: '#0d9488', bg: '#f0fdfa' },
                  { label: 'الدروس العلمية', value: totals.scientific_lessons, color: '#0891b2', bg: '#ecfeff' },
                  { label: 'الخطب', value: totals.sermons, color: '#7c3aed', bg: '#f5f3ff' },
                  { label: 'خطب في مصليات المشروع', value: totals.project_musalla_sermons, color: '#9333ea', bg: '#faf5ff' },
                  { label: 'الجولات', value: totals.tours, color: '#2563eb', bg: '#eff6ff' },
                  { label: 'الملتقيات', value: totals.forums, color: '#c026d3', bg: '#fdf4ff' },
                  { label: 'الإعلامية', value: totals.media, color: '#ea580c', bg: '#fff7ed' },
                  { label: 'الزيارات', value: totals.visits, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'الإصلاح', value: totals.reform, color: '#ca8a04', bg: '#fefce8' },
                  { label: 'أخرى', value: totals.other, color: '#64748b', bg: '#f8fafc' },
                ]

                return (
                  <>
                    {/* الإجمالي الكلي */}
                    <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-teal to-cyan text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </div>
                        <span className="font-bold text-lg">إجمالي جميع الأنشطة</span>
                      </div>
                      <span className="text-3xl font-black">{grandTotal}</span>
                    </div>

                    {/* بطاقات الأنواع */}
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
                      {STATS.map(stat => (
                        <div
                          key={stat.label}
                          className="rounded-xl p-3 text-center transition-all duration-300 hover:scale-105 hover:shadow-md border"
                          style={{ backgroundColor: stat.bg, borderColor: stat.color + '20' }}
                        >
                          <div
                            className="text-2xl md:text-3xl font-black mb-1"
                            style={{ color: stat.color }}
                          >
                            {stat.value}
                          </div>
                          <div
                            className="text-[11px] md:text-xs font-semibold leading-tight"
                            style={{ color: stat.color + 'cc' }}
                          >
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-amber-200 border border-amber-300" />
                لم يُدخل النموذج هذا الشهر
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-orange-200 border border-orange-300" />
                نموذج فارغ (بدون أنشطة)
              </span>
            </div>

            <ActivitiesTable
              summaries={summaries}
              onExport={handleExport}
              onDelete={handleDelete}
              canDelete={canDelete}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
