import { useState, useEffect } from 'react'
import { ActivityRowActions } from './ActivityRowActions'
import '../../styles/theme.css'

const STEP_PREFIX = 'step4'

interface Activity {
  activity_type: string
  execution_date: string
  details: string
  target_audience?: string
  location?: string
  beneficiaries_count?: number
  tour_responsible?: string
}

interface Props {
  activities: Activity[]
  onChange: (activities: Activity[]) => void
  onDeleteActivity?: (activity: Activity & { id?: number }) => void | Promise<void>
  onUpdateActivity?: (activity: Activity & { id?: number }) => void | Promise<void>
  onSaveActivity?: (activity: Activity & { id?: number }) => Promise<(Activity & { id?: number }) | null>
}

function Step4_Tours({ activities, onChange, onDeleteActivity, onUpdateActivity, onSaveActivity }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [localActivities, setLocalActivities] = useState<Activity[]>(
    activities.length > 0 ? activities : []
  )

  useEffect(() => {
    onChange([...localActivities])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localActivities])

  const updateActivity = (index: number, field: keyof Activity, value: any) => {
    const updated = [...localActivities]
    updated[index] = { ...updated[index], [field]: value }
    setLocalActivities(updated)
  }

  const addActivity = () => {
    const newIndex = localActivities.length
    setLocalActivities([
      ...localActivities,
      { activity_type: 'tour', execution_date: '', details: '', target_audience: '', location: '', beneficiaries_count: 0, tour_responsible: '' },
    ])
    setEditingIndex(newIndex)
  }

  const openEdit = async (index: number) => {
    if (editingIndex === index) {
      const activity = localActivities[index] as (Activity & { id?: number }) | undefined
      if (activity?.id && onUpdateActivity) {
        await Promise.resolve(onUpdateActivity(activity))
      } else if (activity && !activity.id && onSaveActivity) {
        const saved = await onSaveActivity(activity)
        if (saved) {
          setLocalActivities((prev) => {
            const next = [...prev]
            next[index] = saved
            return next
          })
        }
      }
      setEditingIndex(null)
    } else { setEditingIndex(index); scrollToActivity(index) }
  }

  const removeActivity = async (index: number) => {
    const activity = localActivities[index] as (Activity & { id?: number }) | undefined
    if (onDeleteActivity && activity?.id) await Promise.resolve(onDeleteActivity(activity))
    setLocalActivities(localActivities.filter((_, i) => i !== index))
  }

  const scrollToActivity = (index: number) => {
    document.getElementById(`${STEP_PREFIX}-activity-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="w-full">
      <div className="block md:hidden space-y-4">
        {localActivities.map((activity, index) => (
          <div key={index} id={`${STEP_PREFIX}-activity-${index}`} className="activity-card bg-white rounded-2xl shadow-soft border border-teal/10 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-lightBlueGray">
              <span className="text-sm font-bold text-teal">النشاط #{index + 1}</span>
              <ActivityRowActions rowId={`${STEP_PREFIX}-activity-${index}`} onDelete={() => removeActivity(index)} onEdit={() => openEdit(index)} isEditing={editingIndex === index} />
            </div>
            {editingIndex === index ? (
              <>
                <div><label className="block text-xs font-semibold text-darkGray mb-1">تفاصيل النشاط باختصار (مع تحديد نوع الجولة)</label><textarea value={activity.details} onChange={(e) => updateActivity(index, 'details', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal focus:border-teal min-h-[80px]" placeholder="مثال: جولة مركزية - جولة منطقة - جولة مخيم" /></div>
                <div><label className="block text-xs font-semibold text-darkGray mb-1">مسؤول الجولة</label><input type="text" value={activity.tour_responsible || ''} onChange={(e) => updateActivity(index, 'tour_responsible', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal focus:border-teal" placeholder="مسؤول الجولة" /></div>
                <div><label className="block text-xs font-semibold text-darkGray mb-1">مكان التنفيذ</label><input type="text" value={activity.location || ''} onChange={(e) => updateActivity(index, 'location', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal focus:border-teal" placeholder="مكان التنفيذ" /></div>
                <div><label className="block text-xs font-semibold text-darkGray mb-1">عدد المستفيدين</label><input type="number" value={activity.beneficiaries_count || 0} onChange={(e) => updateActivity(index, 'beneficiaries_count', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal focus:border-teal" min="0" placeholder="0" /></div>
              </>
            ) : (
              <>
                <div><span className="text-xs font-semibold text-darkGray">تفاصيل النشاط: </span><span className="text-slate-800">{activity.details || '—'}</span></div>
                <div><span className="text-xs font-semibold text-darkGray">مسؤول الجولة: </span><span className="text-slate-800">{activity.tour_responsible || '—'}</span></div>
                <div><span className="text-xs font-semibold text-darkGray">مكان التنفيذ: </span><span className="text-slate-800">{activity.location || '—'}</span></div>
                <div><span className="text-xs font-semibold text-darkGray">عدد المستفيدين: </span><span className="text-slate-800">{activity.beneficiaries_count ?? '—'}</span></div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="hidden md:block table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>م.</th>
              <th>تفاصيل النشاط باختصار (مع تحديد نوع الجولة)</th>
              <th>مسؤول الجولة</th>
              <th>مكان التنفيذ</th>
              <th>عدد المستفيدين</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {localActivities.map((activity, index) => (
              <tr key={index} id={`${STEP_PREFIX}-activity-${index}`}>
                <td>{index + 1}</td>
                {editingIndex === index ? (
                  <>
                    <td><textarea value={activity.details} onChange={(e) => updateActivity(index, 'details', e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal min-h-[60px]" placeholder="مثال: جولة مركزية - جولة منطقة - جولة مخيم" /></td>
                    <td><input type="text" value={activity.tour_responsible || ''} onChange={(e) => updateActivity(index, 'tour_responsible', e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal" /></td>
                    <td><input type="text" value={activity.location || ''} onChange={(e) => updateActivity(index, 'location', e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal" /></td>
                    <td><input type="number" value={activity.beneficiaries_count || 0} onChange={(e) => updateActivity(index, 'beneficiaries_count', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded border border-gray-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal" min="0" /></td>
                  </>
                ) : (
                  <>
                    <td className="text-slate-800">{activity.details || '—'}</td>
                    <td className="text-slate-800">{activity.tour_responsible || '—'}</td>
                    <td className="text-slate-800">{activity.location || '—'}</td>
                    <td className="text-slate-800">{activity.beneficiaries_count ?? '—'}</td>
                  </>
                )}
                <td><ActivityRowActions rowId={`${STEP_PREFIX}-activity-${index}`} onDelete={() => removeActivity(index)} onEdit={() => openEdit(index)} isEditing={editingIndex === index} compact /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-start">
        <button type="button" className="px-5 py-2.5 bg-gradient-to-r from-teal to-teal-light hover:from-teal-dark hover:to-teal text-white rounded-xl font-semibold shadow-soft hover:shadow-soft-lg transition-all duration-300 flex items-center gap-2" onClick={addActivity}>
          <span>+</span>
          <span>إضافة نشاط آخر</span>
        </button>
      </div>
    </div>
  )
}

export default Step4_Tours
