import { useState, useEffect, useRef, useMemo, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../services/auth'
import { PROGRAM_OPTIONS, programLabel } from '../../constants/programs'
import { roleLabel } from '../../constants/roles'
import { type Tag } from '../../constants/tags'
import { TagChips } from '../Dashboard/TagsSelect'
import { FilterBar, SearchField, SelectField } from './Field'
import UserFormModal, { type UserFormValues } from './UserFormModal'
import { errorMessage } from './errors'

export interface UserRow {
  id: number
  name: string
  email: string | null
  id_number: string | null
  region: string | null
  governorate: string | null
  program_type: string | null
  administrative_title: string | null
  role: string
  is_active?: boolean
  disabled_at?: string | null
  tags?: Tag[]
  contract_decision?: 'agreed' | 'declined' | 'pending'
  contract_responded_at?: string | null
}

const CONTRACT_BADGE: Record<'agreed' | 'declined' | 'pending', { label: string; className: string }> = {
  agreed: { label: 'موافق', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined: { label: 'غير موافق', className: 'bg-coral/10 text-coral border-coral/30' },
  pending: { label: 'لم يردّ', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

/**
 * أعمدة الجدول. الصفحة الحالية تعرض اثني عشر عموداً دفعةً واحدة فتحتاج تمريراً
 * أفقياً دائماً؛ هنا نعرض الأساسي فقط ونترك الباقي خلف زرّ «أعمدة»، والاختيار
 * محفوظ بالمتصفح.
 */
const COLUMNS = [
  { key: 'id_number', label: 'رقم الهوية' },
  { key: 'email', label: 'البريد' },
  { key: 'region', label: 'المنطقة' },
  { key: 'governorate', label: 'المحافظة' },
  { key: 'administrative_title', label: 'المسمى الإداري' },
  { key: 'program_type', label: 'البرنامج' },
  { key: 'tags', label: 'الصفات' },
  { key: 'contract', label: 'العقد' },
  { key: 'role', label: 'الدور' },
] as const

type ColumnKey = (typeof COLUMNS)[number]['key']
const DEFAULT_COLUMNS: ColumnKey[] = ['region', 'governorate', 'role']
const STORAGE_KEY = 'dashboard2:user_columns'

const EMPTY_FORM: UserFormValues = {
  name: '', email: '', password: '', id_number: '', region: '',
  governorate: '', program_type: '', administrative_title: '', role: 'preacher',
}

export default function UsersTab() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [governorateFilter, setGovernorateFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved) as ColumnKey[]
    } catch {
      /* قيمة تالفة في التخزين — نتجاهلها ونعود للافتراضي */
    }
    return DEFAULT_COLUMNS
  })
  const [columnsOpen, setColumnsOpen] = useState(false)
  const columnsRef = useRef<HTMLDivElement>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[]; warnings?: string[] } | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns))
  }, [visibleColumns])

  useEffect(() => {
    if (!columnsOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [columnsOpen])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const response = await api.get(`/users${params}`)
      setUsers(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const governorateOptions = useMemo(
    () => Array.from(new Set(users.map((u) => u.governorate).filter((g): g is string => !!g?.trim())))
      .sort((a, b) => a.localeCompare(b, 'ar')),
    [users],
  )

  const regionOptions = useMemo(
    () => Array.from(new Set(
      users
        .filter((u) => !governorateFilter || u.governorate === governorateFilter)
        .map((u) => u.region)
        .filter((r): r is string => !!r?.trim()),
    )).sort((a, b) => a.localeCompare(b, 'ar')),
    [users, governorateFilter],
  )

  const displayedUsers = users.filter(
    (u) =>
      (!governorateFilter || u.governorate === governorateFilter) &&
      (!regionFilter || u.region === regionFilter) &&
      (!programFilter || u.program_type === programFilter) &&
      (!contractFilter || (u.contract_decision ?? 'pending') === contractFilter) &&
      (!statusFilter || (u.is_active === false ? 'disabled' : 'active') === statusFilter),
  )

  const disabledCount = displayedUsers.filter((u) => u.is_active === false).length
  const signedCount = displayedUsers.filter((u) => u.contract_decision === 'agreed').length

  const formatDateTime = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString('ar-EG', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  const handleToggleActive = async (u: UserRow) => {
    const nextActive = u.is_active === false
    const question = nextActive
      ? `هل تريد إعادة تفعيل حساب "${u.name}"؟`
      : `هل تريد تعطيل حساب "${u.name}"؟ لن يستطيع الدخول إلى النظام، وتبقى بياناته وتقاريره كما هي.`
    if (!window.confirm(question)) return

    setBusyId(u.id)
    try {
      const res = await api.patch(`/users/${u.id}/status`, { is_active: nextActive })
      setUsers((prev) => prev.map((row) =>
        row.id === u.id ? { ...row, is_active: res.data.is_active, disabled_at: res.data.disabled_at } : row,
      ))
    } catch (err) {
      alert(errorMessage(err, 'فشل تغيير حالة الحساب'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteUser = async (u: UserRow) => {
    if (!window.confirm(`حذف "${u.name}" نهائياً مع كل نماذجه وأنشطته؟ للإيقاف المؤقت استخدم "تعطيل" بدلاً من الحذف.`)) return
    setBusyId(u.id)
    try {
      await api.delete(`/users/${u.id}`)
      loadUsers()
    } catch (err) {
      alert(errorMessage(err, 'فشل حذف المستخدم'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true)
    try {
      const response = await api.get('/users/download-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `نموذج_استيراد_المستخدمين_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/users/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult(response.data)
      loadUsers()
    } catch (err) {
      setImportResult({ created: 0, errors: [errorMessage(err, 'فشل استيراد الملف')] })
    }
    e.target.value = ''
  }

  const activeFilters = [governorateFilter, regionFilter, programFilter, contractFilter, statusFilter].filter(Boolean).length

  const shows = (key: ColumnKey) => visibleColumns.includes(key)

  const cellFor = (key: ColumnKey, u: UserRow): ReactNode => {
    switch (key) {
      case 'id_number': return u.id_number ?? '—'
      case 'email': return u.email ?? '—'
      case 'region': return u.region ?? '—'
      case 'governorate': return u.governorate ?? '—'
      case 'administrative_title': return u.administrative_title ?? '—'
      case 'tags': return <TagChips tags={u.tags} />
      case 'role': return roleLabel(u.role)
      case 'program_type':
        return u.program_type ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20 whitespace-nowrap">
            {programLabel(u.program_type)}
          </span>
        ) : '—'
      case 'contract': {
        const decision = u.contract_decision ?? 'pending'
        return (
          <span
            title={formatDateTime(u.contract_responded_at) ?? undefined}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${CONTRACT_BADGE[decision].className}`}
          >
            {CONTRACT_BADGE[decision].label}
          </span>
        )
      }
    }
  }

  const actionBtn = 'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all disabled:opacity-60'

  return (
    <>
      {/* شريط الإجراءات */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="px-4 h-10 rounded-xl bg-teal text-white text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          إضافة مستخدم
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
        >
          استيراد من Excel
        </button>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={templateLoading}
          className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 transition-all"
        >
          {templateLoading ? 'جاري التحميل...' : 'تنزيل النموذج'}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />

        {/* اختيار الأعمدة */}
        <div className="relative mr-auto" ref={columnsRef}>
          <button
            type="button"
            onClick={() => setColumnsOpen((o) => !o)}
            className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            أعمدة ({visibleColumns.length + 2})
          </button>
          {columnsOpen && (
            <div className="absolute z-30 mt-1 left-0 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5">
              <p className="px-3 py-1.5 text-[11px] text-slate-400">الاسم والحالة والإجراءات ثابتة</p>
              {COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-darkGray hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={shows(col.key)}
                    onChange={() => setVisibleColumns((prev) =>
                      prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key],
                    )}
                    className="accent-teal"
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {importResult !== null && (
        <div className="mb-5 p-4 rounded-xl bg-teal/5 border border-teal/20 text-sm">
          <p className="font-semibold text-teal">تم إنشاء {importResult.created} مستخدم.</p>
          {importResult.errors?.length > 0 && (
            <ul className="mt-2 text-coral list-disc list-inside space-y-0.5">
              {importResult.errors.slice(0, 5).map((msg, i) => <li key={i}>{msg}</li>)}
              {importResult.errors.length > 5 && <li>و {importResult.errors.length - 5} أخطاء أخرى</li>}
            </ul>
          )}
          {/* تحذيرات: صفوف نجح استيرادها لكن قيمة فيها لم تُفهم (دور أو صفة) */}
          {importResult.warnings && importResult.warnings.length > 0 && (
            <ul className="mt-2 text-amber-700 list-disc list-inside space-y-0.5">
              {importResult.warnings.slice(0, 5).map((msg, i) => <li key={i}>{msg}</li>)}
              {importResult.warnings.length > 5 && <li>و {importResult.warnings.length - 5} تنبيهات أخرى</li>}
            </ul>
          )}
        </div>
      )}

      <FilterBar
        activeCount={activeFilters}
        onClear={() => {
          setGovernorateFilter(''); setRegionFilter(''); setProgramFilter('')
          setContractFilter(''); setStatusFilter('')
        }}
        resultLabel={
          <>
            {displayedUsers.length} مستخدم — <span className="font-semibold text-emerald-700">{signedCount}</span> وافق على العقد
            {disabledCount > 0 && <> — <span className="font-semibold text-slate-600">{disabledCount}</span> معطّل</>}
          </>
        }
      >
        <SearchField label="بحث" value={search} onChange={setSearch} placeholder="اسم، بريد، هوية، منطقة" />
        <SelectField
          label="المحافظة"
          value={governorateFilter}
          allLabel="كل المحافظات"
          options={governorateOptions.map((g) => ({ value: g, label: g }))}
          onChange={(v) => { setGovernorateFilter(v); setRegionFilter('') }}
        />
        <SelectField
          label="المنطقة"
          value={regionFilter}
          allLabel="كل المناطق"
          options={regionOptions.map((r) => ({ value: r, label: r }))}
          onChange={setRegionFilter}
        />
        <SelectField
          label="البرنامج"
          value={programFilter}
          allLabel="كل البرامج"
          options={PROGRAM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={setProgramFilter}
        />
        <SelectField
          label="حالة الحساب"
          value={statusFilter}
          allLabel="الكل"
          options={[{ value: 'active', label: 'فعّال' }, { value: 'disabled', label: 'معطّل' }]}
          onChange={setStatusFilter}
        />
        <SelectField
          label="العقد"
          value={contractFilter}
          allLabel="الكل"
          options={[
            { value: 'agreed', label: 'موافق' },
            { value: 'declined', label: 'غير موافق' },
            { value: 'pending', label: 'لم يردّ' },
          ]}
          onChange={setContractFilter}
        />
      </FilterBar>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">جاري التحميل...</div>
        ) : displayedUsers.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            {activeFilters > 0 || search ? 'لا يوجد مستخدمون مطابقون للفلتر المحدد.' : 'لا يوجد مستخدمون.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold text-xs text-slate-500">الاسم</th>
                  {COLUMNS.filter((c) => shows(c.key)).map((c) => (
                    <th key={c.key} className="py-3 px-4 font-bold text-xs text-slate-500 whitespace-nowrap">{c.label}</th>
                  ))}
                  <th className="py-3 px-4 font-bold text-xs text-slate-500">الحالة</th>
                  <th className="py-3 px-4 font-bold text-xs text-slate-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedUsers.map((u) => {
                  const disabled = u.is_active === false
                  return (
                    <tr key={u.id} className={`transition-colors hover:bg-slate-50/70 ${disabled ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-darkGray whitespace-nowrap">{u.name}</td>
                      {COLUMNS.filter((c) => shows(c.key)).map((c) => (
                        <td key={c.key} className="py-3 px-4 text-darkGray whitespace-nowrap">{cellFor(c.key, u)}</td>
                      ))}
                      <td className="py-3 px-4">
                        {disabled ? (
                          <span
                            title={formatDateTime(u.disabled_at) ? `عُطِّل في ${formatDateTime(u.disabled_at)}` : undefined}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap bg-slate-100 text-slate-600 border-slate-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            معطّل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            فعّال
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/preacher/${u.id}`)}
                              className={`${actionBtn} bg-teal/10 text-teal border-teal/20 hover:bg-teal hover:text-white`}
                            >
                              عرض
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className={`${actionBtn} bg-gold/10 text-gold border-gold/20 hover:bg-gold hover:text-white`}
                          >
                            تعديل
                          </button>
                          {currentUser?.id !== u.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(u)}
                                disabled={busyId === u.id}
                                className={`${actionBtn} ${
                                  disabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-600 hover:text-white'
                                }`}
                              >
                                {busyId === u.id ? '...' : disabled ? 'تفعيل' : 'تعطيل'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                disabled={busyId === u.id}
                                title="حذف نهائي — للإيقاف المؤقت استخدم «تعطيل»"
                                className={`${actionBtn} bg-white text-coral border-coral/30 hover:bg-coral hover:text-white`}
                              >
                                حذف
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-300 text-xs px-2">حسابك</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addOpen && (
        <UserFormModal
          title="إضافة مستخدم"
          submitLabel="إضافة"
          requirePassword
          initial={EMPTY_FORM}
          initialTagIds={[]}
          onClose={() => setAddOpen(false)}
          onSubmit={async (values, tagIds) => {
            await api.post('/users', {
              ...values,
              email: values.email.trim() || null,
              id_number: values.id_number.trim() || null,
              region: values.region.trim() || null,
              governorate: values.governorate.trim() || null,
              program_type: values.program_type || null,
              administrative_title: values.administrative_title.trim() || null,
              role: values.role || 'preacher',
              tag_ids: tagIds,
            })
            setAddOpen(false)
            loadUsers()
          }}
        />
      )}

      {editingUser && (
        <UserFormModal
          title={`تعديل: ${editingUser.name}`}
          submitLabel="حفظ"
          initial={{
            name: editingUser.name ?? '',
            email: editingUser.email ?? '',
            password: '',
            id_number: editingUser.id_number ?? '',
            region: editingUser.region ?? '',
            governorate: editingUser.governorate ?? '',
            program_type: editingUser.program_type ?? '',
            administrative_title: editingUser.administrative_title ?? '',
            role: editingUser.role ?? 'preacher',
          }}
          initialTagIds={(editingUser.tags ?? []).map((t) => t.id)}
          onClose={() => setEditingUser(null)}
          onSubmit={async (values, tagIds) => {
            const res = await api.put(`/users/${editingUser.id}`, {
              ...values,
              email: values.email.trim() || null,
              id_number: values.id_number.trim() || null,
              region: values.region.trim() || null,
              governorate: values.governorate.trim() || null,
              program_type: values.program_type || null,
              administrative_title: values.administrative_title.trim() || null,
              role: values.role || 'preacher',
              password: values.password.trim() || null,
              tag_ids: tagIds,
            })
            setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...res.data } : u)))
            setEditingUser(null)
            loadUsers()
          }}
        />
      )}
    </>
  )
}
