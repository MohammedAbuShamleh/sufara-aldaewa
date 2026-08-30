import { useState } from 'react'
import { PROGRAM_OPTIONS } from '../../constants/programs'
import { ROLE_OPTIONS } from '../../constants/roles'
import { TagsSelect } from '../Dashboard/TagsSelect'
import { errorMessage } from './errors'

export interface UserFormValues {
  name: string
  email: string
  password: string
  id_number: string
  region: string
  governorate: string
  program_type: string
  administrative_title: string
  role: string
}

/**
 * نموذج المستخدم — إضافةً وتعديلاً.
 *
 * الصفحة الحالية تكرّر النموذج نفسه مرتين (نافذة الإضافة ونافذة التعديل) بحقول
 * متطابقة تقريباً، فأي حقل جديد يلزم إضافته في مكانين. هنا مكوّن واحد يخدم
 * الحالتين، والفرق الوحيد بينهما أن كلمة المرور مطلوبة عند الإضافة واختيارية
 * عند التعديل (فارغة تعني: لا تغيّرها).
 */
export default function UserFormModal({
  title,
  submitLabel,
  initial,
  initialTagIds,
  requirePassword = false,
  onSubmit,
  onClose,
}: {
  title: string
  submitLabel: string
  initial: UserFormValues
  initialTagIds: number[]
  requirePassword?: boolean
  onSubmit: (values: UserFormValues, tagIds: number[]) => Promise<void>
  onClose: () => void
}) {
  const [values, setValues] = useState<UserFormValues>(initial)
  const [tagIds, setTagIds] = useState<number[]>(initialTagIds)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key: keyof UserFormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!values.email.trim() && !values.id_number.trim()) {
      setError('يجب إدخال البريد الإلكتروني أو رقم الهوية على الأقل')
      return
    }

    setSaving(true)
    try {
      await onSubmit({ ...values, name: values.name.trim() }, tagIds)
    } catch (err) {
      setError(errorMessage(err, 'تعذّر حفظ البيانات'))
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-darkGray focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-lg font-bold text-darkGray">{title}</h4>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="إغلاق">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>الاسم *</label>
              <input type="text" value={values.name} onChange={(e) => set('name', e.target.value)} required className={input} />
            </div>
            <div>
              <label className={labelCls}>رقم الهوية</label>
              <input type="text" value={values.id_number} onChange={(e) => set('id_number', e.target.value)} className={input} />
            </div>
            <div>
              <label className={labelCls}>البريد الإلكتروني</label>
              <input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} placeholder="اختياري" className={input} />
            </div>
            <div>
              <label className={labelCls}>{requirePassword ? 'كلمة المرور *' : 'كلمة مرور جديدة'}</label>
              <input
                type="password"
                value={values.password}
                onChange={(e) => set('password', e.target.value)}
                required={requirePassword}
                minLength={6}
                placeholder={requirePassword ? '' : 'اتركها فارغة لإبقائها كما هي'}
                className={input}
              />
            </div>
            <div>
              <label className={labelCls}>الدور *</label>
              <select value={values.role} onChange={(e) => set('role', e.target.value)} className={input}>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>المحافظة</label>
              <input type="text" value={values.governorate} onChange={(e) => set('governorate', e.target.value)} className={input} />
            </div>
            <div>
              <label className={labelCls}>المنطقة</label>
              <input type="text" value={values.region} onChange={(e) => set('region', e.target.value)} className={input} />
            </div>
            <div>
              <label className={labelCls}>البرنامج</label>
              <select value={values.program_type} onChange={(e) => set('program_type', e.target.value)} className={input}>
                <option value="">بدون تحديد</option>
                {PROGRAM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>المسمى الإداري</label>
              <input
                type="text"
                value={values.administrative_title}
                onChange={(e) => set('administrative_title', e.target.value)}
                placeholder="اختياري"
                className={input}
              />
            </div>
          </div>

          <TagsSelect value={tagIds} onChange={setTagIds} />

          {error && (
            <p className="text-sm text-coral bg-coral/10 border border-coral/25 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-teal text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {saving ? 'جاري الحفظ...' : submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 h-11 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
