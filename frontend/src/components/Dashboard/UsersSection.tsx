import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../services/auth'
import '../../styles/theme.css'

interface UserRow {
  id: number
  name: string
  email: string | null
  id_number: string | null
  region: string | null
  governorate: string | null
  role: string
}

export default function UsersSection() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)
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
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

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
      })
      setForm({ name: '', email: '', password: '', id_number: '', region: '', governorate: '' })
      setModalOpen(false)
      loadUsers()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'فشل إضافة المستخدم'
      setFormError(msg)
    } finally {
      setFormLoading(false)
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
        </div>
      )}

      {listExpanded && (
        <>
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث (اسم، بريد، رقم هوية، منطقة، محافظة)"
              className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-300 bg-lightBlueGray text-darkGray text-sm"
            />
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
                    <th className="py-2 px-2 font-semibold text-darkGray">الدور</th>
                    <th className="py-2 px-2 font-semibold text-darkGray">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-darkGray">{u.name}</td>
                      <td className="py-2 px-2 text-darkGray">{u.email ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.id_number ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.region ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.governorate ?? '—'}</td>
                      <td className="py-2 px-2 text-darkGray">{u.role === 'admin' ? 'أدمن' : 'داعية'}</td>
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
              {users.length === 0 && (
                <p className="py-6 text-center text-darkGray/70">لا يوجد مستخدمون.</p>
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
    </div>
  )
}
