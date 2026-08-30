import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../services/auth'
import { PROGRAM_OPTIONS, programLabel } from '../../constants/programs'
import { ROLE_OPTIONS, roleLabel } from '../../constants/roles'
import { type Tag } from '../../constants/tags'
import { TagsSelect, TagChips } from './TagsSelect'
import '../../styles/theme.css'

interface UserRow {
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

// شارات القرار تجاه عقد الكفالة (نفس ألوان كشف العقد في لوحة الإدارة)
const CONTRACT_BADGE: Record<'agreed' | 'declined' | 'pending', { label: string; className: string }> = {
  agreed: { label: 'موافق', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined: { label: 'غير موافق', className: 'bg-coral/10 text-coral border-coral/30' },
  pending: { label: 'لم يردّ', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default function UsersSection() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [governorateFilter, setGovernorateFilter] = useState('')
  const [govDropdownOpen, setGovDropdownOpen] = useState(false)
  const govDropdownRef = useRef<HTMLDivElement>(null)
  const [regionFilter, setRegionFilter] = useState('')
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false)
  const regionDropdownRef = useRef<HTMLDivElement>(null)
  const [programFilter, setProgramFilter] = useState('')
  const [programDropdownOpen, setProgramDropdownOpen] = useState(false)

  // فلتر القرار تجاه عقد الكفالة: '' = الكل
  const [contractFilter, setContractFilter] = useState<'' | 'agreed' | 'declined' | 'pending'>('')

  // فلتر حالة الحساب: '' = الكل
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'disabled'>('')
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const programDropdownRef = useRef<HTMLDivElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[]; warnings?: string[] } | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [listExpanded, setListExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    id_number: '',
    region: '',
    governorate: '',
    program_type: '',
    administrative_title: '',
    role: 'preacher',
  })
  const [formTagIds, setFormTagIds] = useState<number[]>([])
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    id_number: '',
    region: '',
    governorate: '',
    program_type: '',
    administrative_title: '',
    role: 'preacher',
    password: '',
  })
  const [editTagIds, setEditTagIds] = useState<number[]>([])
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

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
  }, [search])

  // إغلاق قائمة المحافظات عند الضغط خارجها
  useEffect(() => {
    if (!govDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (govDropdownRef.current && !govDropdownRef.current.contains(e.target as Node)) {
        setGovDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [govDropdownOpen])

  // إغلاق قائمة المناطق الفرعية عند الضغط خارجها
  useEffect(() => {
    if (!regionDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target as Node)) {
        setRegionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [regionDropdownOpen])

  // إغلاق قائمة البرنامج عند الضغط خارجها
  useEffect(() => {
    if (!programDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (programDropdownRef.current && !programDropdownRef.current.contains(e.target as Node)) {
        setProgramDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [programDropdownOpen])

  // قائمة المحافظات الموجودة فعلياً (فريدة ومرتبة)
  const governorateOptions = Array.from(
    new Set(users.map((u) => u.governorate).filter((g): g is string => !!g && g.trim() !== '')),
  ).sort((a, b) => a.localeCompare(b, 'ar'))

  // قائمة المناطق الفرعية — مقيّدة بالمحافظة المختارة إن وُجدت
  const regionOptions = Array.from(
    new Set(
      users
        .filter((u) => !governorateFilter || u.governorate === governorateFilter)
        .map((u) => u.region)
        .filter((r): r is string => !!r && r.trim() !== ''),
    ),
  ).sort((a, b) => a.localeCompare(b, 'ar'))

  // تطبيق فلاتر المحافظة والمنطقة الفرعية والبرنامج وحالة العقد على المستخدمين المعروضين
  const displayedUsers = users.filter(
    (u) =>
      (!governorateFilter || u.governorate === governorateFilter) &&
      (!regionFilter || u.region === regionFilter) &&
      (!programFilter || u.program_type === programFilter) &&
      (!contractFilter || (u.contract_decision ?? 'pending') === contractFilter) &&
      (!statusFilter || (u.is_active === false ? 'disabled' : 'active') === statusFilter),
  )

  // عدّاد المعطّلين ضمن النطاق المعروض حالياً
  const disabledCount = displayedUsers.filter((u) => u.is_active === false).length

  // عدّاد الموافقين على العقد ضمن النطاق المعروض حالياً
  const signedCount = displayedUsers.filter((u) => u.contract_decision === 'agreed').length

  // تنسيق لحظة (رد على العقد أو تعطيل حساب) بالميلادي: تاريخ + وقت مختصر
  const formatDateTime = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.email.trim() && !form.id_number.trim()) {
      setFormError('يجب إدخال البريد الإلكتروني أو رقم الهوية على الأقل')
      return
    }
    setFormLoading(true)
    try {
      await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim() || null,
        password: form.password,
        id_number: form.id_number.trim() || null,
        region: form.region.trim() || null,
        governorate: form.governorate.trim() || null,
        program_type: form.program_type || null,
        administrative_title: form.administrative_title.trim() || null,
        role: form.role || 'preacher',
        tag_ids: formTagIds,
      })
      setForm({ name: '', email: '', password: '', id_number: '', region: '', governorate: '', program_type: '', administrative_title: '', role: 'preacher' })
      setFormTagIds([])
      setModalOpen(false)
      loadUsers()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'فشل إضافة المستخدم'
      setFormError(msg)
    } finally {
      setFormLoading(false)
    }
  }

  const openEdit = (u: UserRow) => {
    setEditingUser(u)
    setEditForm({
      name: u.name ?? '',
      email: u.email ?? '',
      id_number: u.id_number ?? '',
      region: u.region ?? '',
      governorate: u.governorate ?? '',
      program_type: u.program_type ?? '',
      administrative_title: u.administrative_title ?? '',
      role: u.role ?? 'preacher',
      password: '',
    })
    setEditTagIds((u.tags ?? []).map((t) => t.id))
    setEditError('')
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setEditError('')
    if (!editForm.email.trim() && !editForm.id_number.trim()) {
      setEditError('يجب إدخال البريد الإلكتروني أو رقم الهوية على الأقل')
      return
    }
    setEditLoading(true)
    try {
      const res = await api.put(`/users/${editingUser.id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        id_number: editForm.id_number.trim() || null,
        region: editForm.region.trim() || null,
        governorate: editForm.governorate.trim() || null,
        program_type: editForm.program_type || null,
        administrative_title: editForm.administrative_title.trim() || null,
        role: editForm.role || 'preacher',
        password: editForm.password.trim() || null,
        tag_ids: editTagIds,
      })
      // نحدّث الصف فوراً من رد الخادم (المصدر الموثوق) حتى تظهر القيمة الجديدة
      // مباشرةً دون الاعتماد على إعادة الجلب — تفادياً لأي كاش على GET /users.
      const updatedId = editingUser.id
      setUsers((prev) => prev.map((u) => (u.id === updatedId ? { ...u, ...res.data } : u)))
      setEditingUser(null)
      loadUsers()
    } catch (err: any) {
      const data = err.response?.data
      const msg =
        data?.message ||
        data?.errors?.email?.[0] ||
        data?.errors?.id_number?.[0] ||
        data?.errors?.name?.[0] ||
        'فشل تحديث البيانات'
      setEditError(msg)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true)
    try {
      const response = await api.get('/users/download-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `نموذج_استيراد_المستخدمين_${new Date().toISOString().slice(0, 10)}.xlsx`)
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

  // تعطيل الحساب أو إعادة تفعيله — البديل عن الحذف: يمنع الدخول ويُبقي
  // بيانات الداعية ونماذجه في التقارير.
  const handleToggleActive = async (u: UserRow) => {
    const nextActive = u.is_active === false
    const question = nextActive
      ? `هل تريد إعادة تفعيل حساب "${u.name}"؟`
      : `هل تريد تعطيل حساب "${u.name}"؟ لن يستطيع الدخول إلى النظام، وتبقى بياناته وتقاريره كما هي.`
    if (!window.confirm(question)) return

    setTogglingId(u.id)
    try {
      const res = await api.patch(`/users/${u.id}/status`, { is_active: nextActive })
      setUsers((prev) =>
        prev.map((row) =>
          row.id === u.id
            ? { ...row, is_active: res.data.is_active, disabled_at: res.data.disabled_at }
            : row,
        ),
      )
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل تغيير حالة الحساب')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteUser = async (u: UserRow) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${u.name}"؟`)) return
    setDeletingId(u.id)
    try {
      await api.delete(`/users/${u.id}`)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل حذف المستخدم')
    } finally {
      setDeletingId(null)
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
    } catch (err: any) {
      setImportResult({
        created: 0,
        errors: [err.response?.data?.message || 'فشل استيراد الملف'],
      })
    }
    e.target.value = ''
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-teal/10 p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-teal">المستخدمون (الدعاة)</h3>
          {users.length > 0 && (
            <button
              type="button"
              onClick={() => setListExpanded(!listExpanded)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {listExpanded ? 'إغلاق القائمة' : `عرض القائمة (${users.length})`}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:opacity-90"
          >
            إضافة مستخدم
          </button>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateLoading}
            className="px-4 py-2 rounded-xl bg-slate-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-70"
          >
            {templateLoading ? 'جاري التحميل...' : 'تنزيل نموذج Excel'}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:opacity-90"
          >
            استيراد من Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportExcel}
          />
        </div>
      </div>

      {importResult !== null && (
        <div className="mb-4 p-3 rounded-lg bg-teal/10 border border-teal/30 text-sm">
          <p className="font-medium text-teal">تم إنشاء {importResult.created} مستخدم.</p>
          {importResult.errors?.length > 0 && (
            <ul className="mt-2 text-coral list-disc list-inside">
              {importResult.errors.slice(0, 5).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
              {importResult.errors.length > 5 && (
                <li>و {importResult.errors.length - 5} أخطاء أخرى</li>
              )}
            </ul>
          )}
          {/* تحذيرات: صفوف نجح استيرادها لكن قيمة فيها لم تُفهم (دور أو صفة) */}
          {importResult.warnings && importResult.warnings.length > 0 && (
            <ul className="mt-2 text-amber-700 list-disc list-inside">
              {importResult.warnings.slice(0, 5).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
              {importResult.warnings.length > 5 && (
                <li>و {importResult.warnings.length - 5} تنبيهات أخرى</li>
              )}
            </ul>
          )}
        </div>
      )}

      {listExpanded && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث (اسم، بريد، رقم هوية، منطقة، محافظة)"
              className="flex-1 min-w-[200px] max-w-md px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray text-sm"
            />

            {/* فلتر المحافظة — أيقونة تفتح قائمة المحافظات للاختيار */}
            <div className="relative" ref={govDropdownRef}>
              <button
                type="button"
                onClick={() => setGovDropdownOpen((o) => !o)}
                title="فلترة حسب المحافظة"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  governorateFilter
                    ? 'border-teal bg-teal/10 text-teal'
                    : 'border-gray-300 bg-lightBlueGray text-darkGray hover:bg-slate-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                <span>{governorateFilter || 'المحافظة'}</span>
              </button>

              {govDropdownOpen && (
                <div className="absolute z-30 mt-1 w-56 max-h-72 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 py-1 right-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGovernorateFilter('')
                      setRegionFilter('')
                      setGovDropdownOpen(false)
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                      governorateFilter === '' ? 'text-teal font-semibold' : 'text-darkGray'
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
                          setGovernorateFilter(gov)
                          setRegionFilter('')
                          setGovDropdownOpen(false)
                        }}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                          governorateFilter === gov ? 'text-teal font-semibold' : 'text-darkGray'
                        }`}
                      >
                        {gov}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* فلتر المنطقة الفرعية — أيقونة تفتح قائمة المناطق للاختيار */}
            <div className="relative" ref={regionDropdownRef}>
              <button
                type="button"
                onClick={() => setRegionDropdownOpen((o) => !o)}
                title="فلترة حسب المنطقة الفرعية"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  regionFilter
                    ? 'border-teal bg-teal/10 text-teal'
                    : 'border-gray-300 bg-lightBlueGray text-darkGray hover:bg-slate-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{regionFilter || 'المنطقة الفرعية'}</span>
              </button>

              {regionDropdownOpen && (
                <div className="absolute z-30 mt-1 w-56 max-h-72 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 py-1 right-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRegionFilter('')
                      setRegionDropdownOpen(false)
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                      regionFilter === '' ? 'text-teal font-semibold' : 'text-darkGray'
                    }`}
                  >
                    كل المناطق
                  </button>
                  {regionOptions.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-darkGray/60">لا توجد مناطق</p>
                  ) : (
                    regionOptions.map((reg) => (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => {
                          setRegionFilter(reg)
                          setRegionDropdownOpen(false)
                        }}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                          regionFilter === reg ? 'text-teal font-semibold' : 'text-darkGray'
                        }`}
                      >
                        {reg}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* فلتر البرنامج — أيقونة تفتح قائمة الأنواع للاختيار */}
            <div className="relative" ref={programDropdownRef}>
              <button
                type="button"
                onClick={() => setProgramDropdownOpen((o) => !o)}
                title="فلترة حسب البرنامج"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  programFilter
                    ? 'border-teal bg-teal/10 text-teal'
                    : 'border-gray-300 bg-lightBlueGray text-darkGray hover:bg-slate-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>{programLabel(programFilter) || 'البرنامج'}</span>
              </button>

              {programDropdownOpen && (
                <div className="absolute z-30 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 right-0">
                  <button
                    type="button"
                    onClick={() => {
                      setProgramFilter('')
                      setProgramDropdownOpen(false)
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                      programFilter === '' ? 'text-teal font-semibold' : 'text-darkGray'
                    }`}
                  >
                    كل البرامج
                  </button>
                  {PROGRAM_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setProgramFilter(opt.value)
                        setProgramDropdownOpen(false)
                      }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-slate-50 ${
                        programFilter === opt.value ? 'text-teal font-semibold' : 'text-darkGray'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* فلتر التوقيع على عقد الكفالة */}
            <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden text-sm">
              {([
                { value: '', label: 'الكل' },
                { value: 'agreed', label: 'موافق' },
                { value: 'declined', label: 'غير موافق' },
                { value: 'pending', label: 'لم يردّ' },
              ] as const).map((opt) => (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  onClick={() => setContractFilter(opt.value)}
                  className={`px-3 py-2 font-medium transition-all border-l border-gray-200 last:border-l-0 ${
                    contractFilter === opt.value
                      ? 'bg-teal text-white'
                      : 'bg-white text-darkGray hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* فلتر حالة الحساب (فعّال / معطّل) */}
            <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden text-sm">
              {([
                { value: '', label: 'كل الحسابات' },
                { value: 'active', label: 'فعّال' },
                { value: 'disabled', label: 'معطّل' },
              ] as const).map((opt) => (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-2 font-medium transition-all border-l border-gray-200 last:border-l-0 ${
                    statusFilter === opt.value
                      ? 'bg-teal text-white'
                      : 'bg-white text-darkGray hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <span className="text-sm text-slate-500">
              وافق <span className="font-bold text-teal">{signedCount}</span> من {displayedUsers.length}
              {disabledCount > 0 && (
                <> — معطّل <span className="font-bold text-coral">{disabledCount}</span></>
              )}
            </span>

            {(governorateFilter || regionFilter || programFilter || contractFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setGovernorateFilter('')
                  setRegionFilter('')
                  setProgramFilter('')
                  setContractFilter('')
                  setStatusFilter('')
                }}
                className="text-sm text-coral hover:underline"
              >
                مسح الفلتر
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-darkGray">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-2 font-semibold text-darkGray">الاسم</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">البريد</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">رقم الهوية</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">المنطقة</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">المحافظة</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">المسمى الإداري</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">الصفات</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">البرنامج</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">العقد</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">الدور</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">الحالة</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-100 ${u.is_active === false ? 'bg-slate-50/80 opacity-70' : ''}`}
                    >
                      <td className="py-2 px-2 text-darkGray">{u.name}</td>
                      <td className="py-2 px-2 text-darkGray">{u.email ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.id_number ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.region ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.governorate ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.administrative_title ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray"><TagChips tags={u.tags} /></td>
                      <td className="py-2 px-2 text-darkGray">
                        {u.program_type ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20 whitespace-nowrap">
                            {programLabel(u.program_type)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          title={formatDateTime(u.contract_responded_at) ?? undefined}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                            CONTRACT_BADGE[u.contract_decision ?? 'pending'].className
                          }`}
                        >
                          {CONTRACT_BADGE[u.contract_decision ?? 'pending'].label}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-darkGray">{roleLabel(u.role)}</td>
                      <td className="py-2 px-2">
                        {u.is_active === false ? (
                          <span
                            title={formatDateTime(u.disabled_at) ? `عُطِّل في ${formatDateTime(u.disabled_at)}` : undefined}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap bg-slate-100 text-slate-600 border-slate-300"
                          >
                            معطّل
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200">
                            فعّال
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/preacher/${u.id}`)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal/10 text-teal hover:bg-teal hover:text-white border border-teal/20 transition-all"
                            >
                              عرض
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gold/10 text-gold hover:bg-gold hover:text-white border border-gold/20 transition-all"
                          >
                            تعديل
                          </button>
                          {currentUser?.id !== u.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              disabled={togglingId === u.id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all disabled:opacity-70 ${
                                u.is_active === false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-600 hover:text-white'
                              }`}
                            >
                              {togglingId === u.id
                                ? 'جاري...'
                                : u.is_active === false
                                  ? 'تفعيل'
                                  : 'تعطيل'}
                            </button>
                          )}
                          {currentUser?.id !== u.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingId === u.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-coral/90 hover:bg-coral text-white disabled:opacity-70 transition-all"
                            >
                              {deletingId === u.id ? 'جاري...' : 'حذف'}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayedUsers.length === 0 && (
                <p className="py-6 text-center text-darkGray/70">
                  {governorateFilter || regionFilter || programFilter || contractFilter || statusFilter
                    ? `لا يوجد مستخدمون مطابقون للفلتر المحدد.`
                    : 'لا يوجد مستخدمون.'}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {!listExpanded && users.length > 0 && (
        <p className="text-sm text-slate-500 py-2">القائمة مطوية — {users.length} مستخدم. اضغط "عرض القائمة" للعرض.</p>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-teal/10" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-teal mb-4">إضافة مستخدم (داعية)</h4>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">الاسم *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="اختياري"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">كلمة المرور *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">رقم الهوية</label>
                <input
                  type="text"
                  value={form.id_number}
                  onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">المنطقة</label>
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">المحافظة</label>
                <input
                  type="text"
                  value={form.governorate}
                  onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">البرنامج</label>
                <select
                  value={form.program_type}
                  onChange={(e) => setForm({ ...form, program_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                >
                  <option value="">بدون تحديد</option>
                  {PROGRAM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">المسمى الإداري</label>
                <input
                  type="text"
                  value={form.administrative_title}
                  onChange={(e) => setForm({ ...form, administrative_title: e.target.value })}
                  placeholder="اختياري"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <TagsSelect value={formTagIds} onChange={setFormTagIds} />
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">الدور *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-coral">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-teal text-white font-medium disabled:opacity-70"
                >
                  {formLoading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-darkGray"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-teal/10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-teal mb-4">تعديل بيانات الداعية</h4>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">الاسم *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="اختياري"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">رقم الهوية</label>
                <input
                  type="text"
                  value={editForm.id_number}
                  onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">المنطقة</label>
                <input
                  type="text"
                  value={editForm.region}
                  onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">المحافظة</label>
                <input
                  type="text"
                  value={editForm.governorate}
                  onChange={(e) => setEditForm({ ...editForm, governorate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">البرنامج</label>
                <select
                  value={editForm.program_type}
                  onChange={(e) => setEditForm({ ...editForm, program_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                >
                  <option value="">بدون تحديد</option>
                  {PROGRAM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">المسمى الإداري</label>
                <input
                  type="text"
                  value={editForm.administrative_title}
                  onChange={(e) => setEditForm({ ...editForm, administrative_title: e.target.value })}
                  placeholder="اختياري"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              <TagsSelect value={editTagIds} onChange={setEditTagIds} />
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">الدور *</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">كلمة مرور جديدة</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="اتركها فارغة لعدم التغيير"
                  minLength={6}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray"
                />
              </div>
              {editError && <p className="text-sm text-coral">{editError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-teal text-white font-medium disabled:opacity-70"
                >
                  {editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-darkGray"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
