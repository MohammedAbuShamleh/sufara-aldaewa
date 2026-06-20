import { useState, useEffect } from 'react'
import FormHeader from '../Layout/FormHeader'
import { useAuth } from '../../services/auth'
import { ActivityRowActions } from './ActivityRowActions'
import Toast from '../UI/Toast'
import api from '../../services/api'
import '../../styles/theme.css'

interface Activity {
  id?: number
  activity_type: string
  execution_date: string
  details: string
  target_audience?: string
  location?: string
  beneficiaries_count?: number
  tour_responsible?: string
  coordination_responsible?: string
}

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number'
  placeholder?: string
}

interface Section {
  key: string
  title: string
  emoji: string
  activityType: string
  color: string
  fields: FieldDef[]
}

const SECTIONS: Section[] = [
  {
    key: '1', title: 'الدروس الوعظية', emoji: '📖', activityType: 'preaching_lesson', color: '#0d9488',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط باختصار', type: 'textarea', placeholder: 'أدخل تفاصيل النشاط...' },
      { key: 'target_audience', label: 'الجهة المستهدفة', type: 'text', placeholder: 'الجهة المستهدفة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين (تقديري)', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '2', title: 'الدروس العلمية', emoji: '📚', activityType: 'scientific_lesson', color: '#0891b2',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط باختصار', type: 'textarea', placeholder: 'أدخل تفاصيل النشاط...' },
      { key: 'target_audience', label: 'الجهة المستهدفة', type: 'text', placeholder: 'الجهة المستهدفة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين (تقديري)', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '3', title: 'الخطب', emoji: '🎤', activityType: 'sermon', color: '#7c3aed',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط باختصار', type: 'textarea', placeholder: 'أدخل تفاصيل النشاط...' },
      { key: 'target_audience', label: 'الجهة المستهدفة', type: 'text', placeholder: 'الجهة المستهدفة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين (تقديري)', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '4', title: 'الجولات', emoji: '🚶', activityType: 'tour', color: '#2563eb',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط (مع تحديد نوع الجولة)', type: 'textarea', placeholder: 'مثال: جولة مركزية - جولة منطقة - جولة مخيم' },
      { key: 'tour_responsible', label: 'مسؤول الجولة', type: 'text', placeholder: 'مسؤول الجولة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '5', title: 'الملتقيات', emoji: '🤝', activityType: 'forum', color: '#c026d3',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط (مع تحديد دور الداعية)', type: 'textarea', placeholder: 'مثال: مقدم - قارئ - منشد - واعظ' },
      { key: 'coordination_responsible', label: 'مسؤول التنسيق', type: 'text', placeholder: 'مسؤول التنسيق' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '6', title: 'الأنشطة الإعلامية', emoji: '📱', activityType: 'media', color: '#ea580c',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط باختصار', type: 'textarea', placeholder: 'أدخل تفاصيل النشاط...' },
      { key: 'target_audience', label: 'الجهة المستهدفة', type: 'text', placeholder: 'الجهة المستهدفة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين (تقديري)', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '7', title: 'الزيارات', emoji: '🏠', activityType: 'visit', color: '#16a34a',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط باختصار', type: 'textarea', placeholder: 'أدخل تفاصيل النشاط...' },
      { key: 'target_audience', label: 'الجهة المستهدفة', type: 'text', placeholder: 'الجهة المستهدفة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين (تقديري)', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '8', title: 'الإصلاح', emoji: '⚖️', activityType: 'reform', color: '#ca8a04',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط باختصار', type: 'textarea', placeholder: 'أدخل تفاصيل النشاط...' },
      { key: 'target_audience', label: 'الجهة المستهدفة', type: 'text', placeholder: 'الجهة المستهدفة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين (تقديري)', type: 'number', placeholder: '0' },
    ],
  },
  {
    key: '9', title: 'أخرى', emoji: '📋', activityType: 'other', color: '#64748b',
    fields: [
      { key: 'details', label: 'تفاصيل النشاط باختصار', type: 'textarea', placeholder: 'أدخل تفاصيل النشاط...' },
      { key: 'target_audience', label: 'الجهة المستفيدة', type: 'text', placeholder: 'الجهة المستفيدة' },
      { key: 'location', label: 'مكان التنفيذ', type: 'text', placeholder: 'مكان التنفيذ' },
      { key: 'beneficiaries_count', label: 'عدد المستفيدين', type: 'number', placeholder: '0' },
    ],
  },
]

function MultiStepForm() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Record<string, Activity[]>>({})
  const [formId, setFormId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null)
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [editingMap, setEditingMap] = useState<Record<string, number | null>>({})

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Ensure form exists ──
  const ensureForm = async (): Promise<number | null> => {
    if (formId) return formId
    try {
      const response = await api.get('/forms/my-form')
      const form = response.data
      setFormId(form.id)
      return form.id
    } catch {
      try {
        const payload = {
          preacher_name: (user?.name ?? '').trim(),
          sub_region: user?.region?.trim() || null,
        }
        const response = await api.post('/forms', payload)
        setFormId(response.data.id)
        return response.data.id
      } catch {
        setToast({ message: 'فشل في إنشاء النموذج', type: 'error' })
        return null
      }
    }
  }

  // ── Save single activity ──
  const saveActivity = async (sectionKey: string, index: number) => {
    const section = SECTIONS.find((s) => s.key === sectionKey)
    if (!section) return
    const sectionActivities = activities[sectionKey] || []
    const activity = sectionActivities[index]
    if (!activity) return

    // Frontend validation: must have details
    if (!activity.details || !activity.details.trim()) {
      setToast({ message: 'يرجى إدخال تفاصيل النشاط قبل الحفظ', type: 'warning' })
      return
    }

    if (activity.id) {
      // Update existing
      try {
        const payload: Record<string, unknown> = {
          details: activity.details ?? '',
          target_audience: activity.target_audience ?? null,
          location: activity.location ?? null,
          beneficiaries_count: activity.beneficiaries_count ?? null,
          tour_responsible: activity.tour_responsible ?? null,
          coordination_responsible: activity.coordination_responsible ?? null,
        }
        if (activity.execution_date?.trim()) {
          payload.execution_date = activity.execution_date.trim().slice(0, 10)
        }
        await api.put(`/activities/${activity.id}`, payload)
        setToast({ message: 'تم تحديث النشاط', type: 'success' })
      } catch {
        setToast({ message: 'فشل تحديث النشاط', type: 'error' })
      }
    } else {
      // Create new
      setLoading(true)
      try {
        const fid = await ensureForm()
        if (!fid) return
        const todayDate = new Date().toLocaleDateString('en-CA')
        const payload = {
          form_id: fid,
          activity_type: section.activityType,
          execution_date: todayDate,
          details: activity.details ?? '',
          target_audience: activity.target_audience ?? null,
          location: activity.location ?? null,
          beneficiaries_count: activity.beneficiaries_count ?? null,
          tour_responsible: activity.tour_responsible ?? null,
          coordination_responsible: activity.coordination_responsible ?? null,
        }
        const res = await api.post('/activities', payload)
        setActivities((prev) => {
          const existing = prev[sectionKey] || []
          const next = [...existing]
          next[index] = { ...activity, id: res.data.id }
          return { ...prev, [sectionKey]: next }
        })
        setToast({ message: 'تم حفظ النشاط', type: 'success' })
      } catch {
        setToast({ message: 'فشل حفظ النشاط', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    setEditingMap((prev) => ({ ...prev, [sectionKey]: null }))
  }

  const deleteActivity = async (sectionKey: string, index: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا النشاط؟')) return
    const sectionActivities = activities[sectionKey] || []
    const activity = sectionActivities[index]
    if (activity?.id) {
      try {
        await api.delete(`/activities/${activity.id}`)
      } catch {
        setToast({ message: 'فشل حذف النشاط', type: 'error' })
        return
      }
    }
    setActivities((prev) => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] || []).filter((_, i) => i !== index),
    }))
  }

  const addActivity = (sectionKey: string) => {
    const section = SECTIONS.find((s) => s.key === sectionKey)!
    const newActivity: Activity = {
      activity_type: section.activityType,
      execution_date: '',
      details: '',
      target_audience: '',
      location: '',
      beneficiaries_count: 0,
    }
    // Add special fields
    if (sectionKey === '4') newActivity.tour_responsible = ''
    if (sectionKey === '5') newActivity.coordination_responsible = ''

    setActivities((prev) => {
      const existing = prev[sectionKey] || []
      return { ...prev, [sectionKey]: [...existing, newActivity] }
    })
    // Open the section and set editing
    setOpenSections((prev) => new Set(prev).add(sectionKey))
    const newIndex = (activities[sectionKey] || []).length
    setEditingMap((prev) => ({ ...prev, [sectionKey]: newIndex }))
  }

  const updateActivityField = (sectionKey: string, index: number, field: string, value: any) => {
    setActivities((prev) => {
      const existing = [...(prev[sectionKey] || [])]
      existing[index] = { ...existing[index], [field]: value }
      return { ...prev, [sectionKey]: existing }
    })
  }

  const getStepIndexForActivityType = (type: string): number => {
    const types = ['preaching_lesson', 'scientific_lesson', 'sermon', 'tour', 'forum', 'media', 'visit', 'reform', 'other']
    return types.indexOf(type)
  }

  // ── Load data ──
  useEffect(() => {
    const loadMyForm = async () => {
      setInitialLoading(true)
      try {
        const response = await api.get('/forms/my-form')
        const form = response.data
        setFormId(form.id)
        const loaded: Record<string, Activity[]> = {}
        const toDateOnly = (v: any): string => {
          if (v == null || v === '') return ''
          const s = typeof v === 'string' ? v : String((v as { date?: string })?.date ?? v ?? '')
          return s.slice(0, 10) || ''
        }
        ;(form.activities || []).forEach((activity: any) => {
          const stepIndex = getStepIndexForActivityType(activity.activity_type)
          if (stepIndex !== -1) {
            const stepKey = (stepIndex + 1).toString()
            if (!loaded[stepKey]) loaded[stepKey] = []
            loaded[stepKey].push({
              id: activity.id,
              activity_type: activity.activity_type ?? '',
              execution_date: toDateOnly(activity.execution_date) || '',
              details: activity.details ?? '',
              target_audience: activity.target_audience,
              location: activity.location,
              beneficiaries_count: activity.beneficiaries_count,
              tour_responsible: activity.tour_responsible,
              coordination_responsible: activity.coordination_responsible,
            })
          }
        })
        setActivities(loaded)
        // Auto-open sections that have activities
        const openKeys = new Set(Object.keys(loaded).filter((k) => loaded[k].length > 0))
        setOpenSections(openKeys)
      } catch (err: any) {
        if (err.response?.status === 401) return
        setToast({ message: 'لم يُحمّل نموذج الشهر الحالي.', type: 'warning' })
      } finally {
        setInitialLoading(false)
      }
    }
    loadMyForm()
  }, [])

  // Load notes
  useEffect(() => {
    api.get('/user').then((res) => setNotes(res.data.notes ?? '')).catch(() => {})
  }, [])

  const saveNotes = async () => {
    setNotesSaving(true)
    setNotesSaved(false)
    try {
      await api.patch('/user/notes', { notes })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 3000)
    } catch {
      setToast({ message: 'فشل حفظ الملاحظات', type: 'error' })
    } finally {
      setNotesSaving(false)
    }
  }

  // Count total activities
  const totalActivities = Object.values(activities).reduce((sum, arr) => sum + arr.filter((a) => a.id || (a.details && a.details.trim())).length, 0)

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <FormHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
            <p className="text-teal font-semibold text-sm">جاري تحميل النموذج...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <FormHeader />

      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-5">

        {/* Alert */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl py-2.5 px-4 mb-4 flex items-center gap-2.5">
          <span className="text-amber-500 text-base flex-shrink-0">💡</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            هذا النموذج يخص <span className="font-bold">الشهر الحالي فقط</span>. اضغط على أي قسم لإضافة أنشطتك.
          </p>
        </div>

        {/* Summary Badge */}
        {totalActivities > 0 && (
          <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">إجمالي الأنشطة هذا الشهر</span>
            <span className="text-lg font-extrabold text-teal">{totalActivities}</span>
          </div>
        )}

        {/* Accordion Sections */}
        <div className="space-y-2">
          {SECTIONS.map((section) => {
            const isOpen = openSections.has(section.key)
            const sectionActivities = activities[section.key] || []
            const count = sectionActivities.filter((a) => a.id || (a.details && a.details.trim())).length
            const editingIndex = editingMap[section.key] ?? null

            return (
              <div
                key={section.key}
                className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 ${
                  isOpen ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-right hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-xl flex-shrink-0">{section.emoji}</span>
                  <span className="flex-1 text-sm font-bold text-slate-700">{section.title}</span>
                  {count > 0 && (
                    <span
                      className="min-w-[24px] h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white px-1.5"
                      style={{ backgroundColor: section.color }}
                    >
                      {count}
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Section Content */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                    {/* Activities List */}
                    {sectionActivities.map((activity, index) => (
                      <div
                        key={index}
                        className={`rounded-xl border p-4 transition-all ${
                          editingIndex === index
                            ? 'border-teal/30 bg-teal-50/30'
                            : 'border-slate-100 bg-slate-50/50'
                        }`}
                      >
                        {editingIndex === index ? (
                          // Edit Mode
                          <div className="space-y-3">
                            {section.fields.map((field) => (
                              <div key={field.key}>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label}</label>
                                {field.type === 'textarea' ? (
                                  <textarea
                                    value={(activity as any)[field.key] || ''}
                                    onChange={(e) => updateActivityField(section.key, index, field.key, e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-teal/30 focus:border-teal min-h-[70px] resize-none transition-all"
                                    placeholder={field.placeholder}
                                  />
                                ) : (
                                  <input
                                    type={field.type}
                                    value={(activity as any)[field.key] ?? (field.type === 'number' ? 0 : '')}
                                    onChange={(e) =>
                                      updateActivityField(
                                        section.key, index, field.key,
                                        field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                                    placeholder={field.placeholder}
                                    min={field.type === 'number' ? 0 : undefined}
                                  />
                                )}
                              </div>
                            ))}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => saveActivity(section.key, index)}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal-dark transition-all disabled:opacity-50"
                              >
                                {loading ? (
                                  <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> حفظ...</>
                                ) : (
                                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> حفظ</>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingMap((prev) => ({ ...prev, [section.key]: null }))}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 font-medium truncate">
                                {activity.details || <span className="text-slate-300">بدون تفاصيل</span>}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                {activity.location && (
                                  <span className="text-[11px] text-slate-400">📍 {activity.location}</span>
                                )}
                                {(activity.beneficiaries_count ?? 0) > 0 && (
                                  <span className="text-[11px] text-slate-400">👥 {activity.beneficiaries_count}</span>
                                )}
                                {activity.target_audience && (
                                  <span className="text-[11px] text-slate-400">🎯 {activity.target_audience}</span>
                                )}
                                {activity.tour_responsible && (
                                  <span className="text-[11px] text-slate-400">👤 {activity.tour_responsible}</span>
                                )}
                                {activity.coordination_responsible && (
                                  <span className="text-[11px] text-slate-400">👤 {activity.coordination_responsible}</span>
                                )}
                              </div>
                            </div>
                            <ActivityRowActions
                              rowId={`section-${section.key}-${index}`}
                              onDelete={() => deleteActivity(section.key, index)}
                              onEdit={() => {
                                if (editingIndex === index) {
                                  saveActivity(section.key, index)
                                } else {
                                  setEditingMap((prev) => ({ ...prev, [section.key]: index }))
                                }
                              }}
                              isEditing={false}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Activity Button */}
                    <button
                      type="button"
                      onClick={() => addActivity(section.key)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-teal/40 hover:text-teal hover:bg-teal-50/30 transition-all text-sm font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة نشاط
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Notes */}
        <div className="mt-5 bg-white rounded-xl border border-slate-200/80 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-sm">📝</span>
              <h3 className="text-sm font-bold text-slate-700">ملاحظاتي</h3>
              <span className="text-[10px] text-slate-400">(خاصة بك)</span>
            </div>
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-teal hover:text-white disabled:opacity-50 transition-all"
            >
              {notesSaving ? 'حفظ...' : notesSaved ? '✓ تم' : 'حفظ'}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظاتك الخاصة هنا..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 transition-all placeholder-slate-300"
          />
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

export default MultiStepForm
