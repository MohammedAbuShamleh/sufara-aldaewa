import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../Layout/Header'
import api from '../../services/api'
import '../../styles/theme.css'

interface FormMonth {
  form_id: number
  month: number
  year: number
  month_name: string
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

interface Preacher {
  id: number
  name: string
  email: string | null
  id_number: string | null
  region: string | null
  governorate: string | null
  role: string
  forms: FormMonth[]
}

const ACTIVITY_LABELS: { key: keyof FormMonth['summary']; label: string; color: string }[] = [
  { key: 'preaching_lessons',  label: 'الدروس الوعظية',   color: '#0d9488' },
  { key: 'scientific_lessons', label: 'الدروس العلمية',   color: '#0891b2' },
  { key: 'sermons',            label: 'الخطب',            color: '#7c3aed' },
  { key: 'project_musalla_sermons', label: 'خطب مصليات المشروع', color: '#9333ea' },
  { key: 'tours',              label: 'الجولات',          color: '#d97706' },
  { key: 'forums',             label: 'الملتقيات',        color: '#dc2626' },
  { key: 'media',              label: 'الإعلامية',        color: '#059669' },
  { key: 'visits',             label: 'الزيارات',         color: '#2563eb' },
  { key: 'reform',             label: 'الإصلاح',          color: '#db2777' },
  { key: 'other',              label: 'أخرى',             color: '#64748b' },
]

function PreacherProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [preacher, setPreacher] = useState<Preacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedForm, setExpandedForm] = useState<number | null>(null)
  const [exporting, setExporting] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/users/${id}`)
        setPreacher(res.data)
        setNotes(res.data.notes ?? '')
        if (res.data.forms?.length > 0) {
          setExpandedForm(res.data.forms[0].form_id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const saveNotes = async () => {
    if (!id) return
    setNotesSaving(true)
    setNotesSaved(false)
    try {
      await api.patch(`/users/${id}/notes`, { notes })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 3000)
    } catch {
      alert('فشل حفظ الملاحظات')
    } finally {
      setNotesSaving(false)
    }
  }

  const handleExport = async (formId: number) => {
    setExporting(formId)
    try {
      const response = await api.get(`/export/excel/${formId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `activities_${formId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      alert('حدث خطأ أثناء التصدير')
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
            <p className="text-teal font-medium">جاري تحميل بيانات الداعية...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!preacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-red-500 font-medium">لم يتم العثور على الداعية</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-6 text-teal hover:text-teal-dark font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          العودة للوحة التحكم
        </button>

        {/* Preacher Info Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-teal/10 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal to-cyan flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {preacher.name?.charAt(0) ?? '؟'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{preacher.name}</h1>
              <p className="text-teal font-medium text-sm mt-1">داعية</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-teal/10 text-teal text-sm font-semibold border border-teal/20">
                {preacher.forms.length} نموذج
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
            {[
              { label: 'رقم الهوية', value: preacher.id_number },
              { label: 'المنطقة',    value: preacher.region },
              { label: 'المحافظة',   value: preacher.governorate },
              { label: 'البريد',     value: preacher.email },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                <p className="text-slate-700 font-semibold text-sm">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Forms */}
        <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          النماذج الشهرية
          <span className="text-sm font-normal text-slate-400">({preacher.forms.length} شهر)</span>
        </h2>

        {preacher.forms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow p-10 text-center text-slate-400">
            لا توجد نماذج مسجّلة بعد
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {preacher.forms.map((form) => {
              const isOpen = expandedForm === form.form_id
              const total = Object.entries(form.summary)
                .filter(([k]) => k !== 'project_musalla_sermons')
                .reduce((a, [, b]) => a + (b ?? 0), 0)
              return (
                <div
                  key={form.form_id}
                  className="bg-white rounded-2xl shadow border border-teal/10 overflow-hidden transition-all duration-300"
                >
                  {/* Month Header */}
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-teal/5 transition-colors"
                    onClick={() => setExpandedForm(isOpen ? null : form.form_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal/20 to-cyan/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{form.month_name}</p>
                        <p className="text-xs text-slate-400">{total} نشاط مُسجَّل</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="px-4 py-1.5 rounded-lg bg-teal/10 text-teal text-sm font-semibold hover:bg-teal hover:text-white transition-all duration-200 border border-teal/20"
                        onClick={(e) => { e.stopPropagation(); handleExport(form.form_id) }}
                        disabled={exporting === form.form_id}
                      >
                        {exporting === form.form_id ? '⏳...' : '⬇ تصدير'}
                      </button>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {ACTIVITY_LABELS.map(({ key, label, color }) => (
                          <div
                            key={key}
                            className="rounded-xl p-3 text-center border"
                            style={{ borderColor: color + '30', backgroundColor: color + '0d' }}
                          >
                            <p className="text-2xl font-bold" style={{ color }}>
                              {form.summary[key]}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
                          </div>
                        ))}
                        {/* Total */}
                        <div className="rounded-xl p-3 text-center border border-gold/30 bg-gold/10 col-span-full md:col-span-1">
                          <p className="text-2xl font-bold text-gold">{total}</p>
                          <p className="text-xs text-slate-500 mt-1">المجموع الكلي</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {/* Notes Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-amber-200/60 p-6 mt-2">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h2 className="text-lg font-bold text-amber-700">ملاحظات الإدارة</h2>
            <span className="text-xs text-slate-400 font-normal">(خاصة بالإدارة فقط، غير مرتبطة بالنماذج)</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظاتك هنا..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/50 text-slate-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all placeholder-slate-300"
          />
          <div className="flex items-center justify-between mt-3">
            <span className={`text-sm transition-all duration-300 ${notesSaved ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
              {notesSaved ? '✓ تم الحفظ' : `${notes.length} / 5000 حرف`}
            </span>
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="px-5 py-2 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-60 transition-all shadow-sm hover:shadow-md"
            >
              {notesSaving ? '⏳ جاري الحفظ...' : '💾 حفظ الملاحظات'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PreacherProfile
