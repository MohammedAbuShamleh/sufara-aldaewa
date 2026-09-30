import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { useAuth } from '../../services/auth'
import { roleLabel } from '../../constants/roles'
import Toast from '../UI/Toast'
import { FilterBar, SearchField, SelectField } from './Field'
import { errorMessage } from '../../services/errors'

type Decision = 'agreed' | 'declined' | 'pending'

interface StatusRow {
  id: number
  name: string
  id_number: string | null
  email: string | null
  region: string | null
  governorate: string | null
  role: string
  decision: Decision
  responded_at: string | null
  ip_address: string | null
}

interface StatusPayload {
  version: string
  total: number
  agreed: number
  declined: number
  pending: number
  users: StatusRow[]
}

const DECISION_META: Record<Decision, { label: string; className: string }> = {
  agreed: { label: 'موافق', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined: { label: 'غير موافق', className: 'bg-coral/10 text-coral border-coral/30' },
  pending: { label: 'لم يردّ بعد', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

/**
 * تبويب عقد الكفالة — نفس وظائف القسم الحالي (كشف، تصدير، حذف غير الموافقين)
 * لكن الكشف مفتوح دائماً بدل أن يكون خلف زرّ «عرض»: التبويب لا يُفتح إلا قصداً،
 * فلا معنى لطيّ محتواه الوحيد.
 */
export default function ContractTab() {
  const { user: currentUser } = useAuth()
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/contract/status')
      setData(response.data)
    } catch {
      setToast({ message: 'تعذّر تحميل كشف العقد', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const term = search.trim().toLowerCase()
  const rows = (data?.users ?? []).filter(
    (r) =>
      (!filter || r.decision === filter) &&
      (!term ||
        r.name.toLowerCase().includes(term) ||
        (r.id_number ?? '').toLowerCase().includes(term) ||
        (r.governorate ?? '').toLowerCase().includes(term) ||
        (r.region ?? '').toLowerCase().includes(term)),
  )

  // نفس استثناءات الخادم: لا يُحذف الأدمن ولا حساب صاحب الجلسة،
  // حتى لا يَعِد الزر بما لن يُنفَّذ.
  const deletableDecliners = (data?.users ?? []).filter(
    (r) => r.decision === 'declined' && r.id !== currentUser?.id && r.role !== 'admin',
  )

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('ar-EG', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get('/contract/status/export', {
        params: filter ? { decision: filter } : {},
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `كشف_عقد_الكفالة_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setToast({ message: 'تم تنزيل الكشف', type: 'success' })
    } catch {
      setToast({ message: 'تعذّر تصدير الكشف', type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteDecliners = async () => {
    setDeleting(true)
    try {
      const response = await api.delete('/contract/decliners', { data: { confirm: true } })
      setToast({ message: response.data?.message ?? 'تم الحذف', type: 'success' })
      setConfirmingDelete(false)
      await load()
    } catch (err) {
      setToast({ message: errorMessage(err, 'تعذّر حذف الحسابات'), type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const cards = data
    ? [
        { label: 'الإجمالي', value: data.total, color: 'text-darkGray', bg: 'border-slate-200' },
        { label: 'موافق', value: data.agreed, color: 'text-emerald-700', bg: 'border-emerald-200 bg-emerald-50/50' },
        { label: 'غير موافق', value: data.declined, color: 'text-coral', bg: 'border-coral/25 bg-coral/5' },
        { label: 'لم يردّ بعد', value: data.pending, color: 'text-amber-700', bg: 'border-amber-200 bg-amber-50/50' },
      ]
    : []

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {data && <span className="text-xs text-slate-400">نسخة العقد {data.version}</span>}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !data}
          className="mr-auto px-4 h-10 rounded-xl bg-gradient-to-r from-teal to-cyan text-white text-sm font-bold shadow-lg shadow-teal/20 hover:shadow-xl disabled:opacity-60 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'جاري التصدير...' : 'تنزيل Excel'}
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {cards.map((card) => (
            <div key={card.label} className={`rounded-2xl border px-4 py-3 ${card.bg}`}>
              <p className="text-xs text-slate-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {data && data.declined > 0 && (
        <div className="mb-5">
          {confirmingDelete ? (
            <div className="rounded-2xl border border-coral/30 bg-coral/5 px-4 py-4">
              <p className="text-sm font-bold text-coral mb-2">
                تأكيد حذف {deletableDecliners.length} حساباً من غير الموافقين
              </p>
              <p className="text-xs text-darkGray/70 mb-3 leading-relaxed">
                سيتم حذف الحسابات التالية نهائياً مع كل نماذجها وأنشطتها، ولا يمكن التراجع عن هذه العملية.
                {data.declined > deletableDecliners.length && (
                  <span className="block mt-1 text-amber-700">
                    ملاحظة: {data.declined - deletableDecliners.length} من غير الموافقين لن يُحذفوا لأنهم حسابات أدمن (بما فيها حسابك).
                  </span>
                )}
              </p>
              <div className="max-h-32 overflow-y-auto mb-3 rounded-lg bg-white border border-slate-200 px-3 py-2">
                {deletableDecliners.length > 0 ? (
                  <ul className="text-xs text-darkGray space-y-1">
                    {deletableDecliners.map((r) => (
                      <li key={r.id}>• {r.name} {r.id_number ? `— ${r.id_number}` : ''}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">لا يوجد حسابات مؤهلة للحذف.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDeleteDecliners}
                  disabled={deleting || deletableDecliners.length === 0}
                  className="px-4 h-10 rounded-lg text-sm font-bold bg-coral hover:bg-coral/90 text-white disabled:opacity-50 transition-all"
                >
                  {deleting ? 'جاري الحذف...' : 'نعم، احذف نهائياً'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="px-4 h-10 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 text-darkGray border border-slate-200 disabled:opacity-50 transition-all"
                >
                  تراجع
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="px-4 h-10 rounded-xl text-sm font-semibold bg-white text-coral hover:bg-coral hover:text-white border border-coral/25 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 7V4a1 1 0 011-1h2a1 1 0 011 1v3" />
              </svg>
              حذف حسابات غير الموافقين ({deletableDecliners.length})
            </button>
          )}
        </div>
      )}

      <FilterBar
        activeCount={[filter, search].filter(Boolean).length}
        onClear={() => { setFilter(''); setSearch('') }}
        resultLabel={<>المعروض: {rows.length} من {data?.total ?? 0}</>}
      >
        <SearchField label="بحث" value={search} onChange={setSearch} placeholder="اسم، هوية، منطقة" />
        <SelectField
          label="القرار"
          value={filter}
          allLabel="الكل"
          options={[
            { value: 'agreed', label: 'موافق' },
            { value: 'declined', label: 'غير موافق' },
            { value: 'pending', label: 'لم يردّ' },
          ]}
          onChange={setFilter}
        />
      </FilterBar>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-slate-500">لا يوجد مستخدمون مطابقون للفلتر المحدد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['الاسم', 'رقم الهوية', 'المنطقة', 'المحافظة', 'الدور', 'حالة العقد', 'تاريخ الرد'].map((h) => (
                    <th key={h} className="py-3 px-4 font-bold text-xs text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-darkGray font-semibold whitespace-nowrap">{r.name}</td>
                    <td className="py-3 px-4 text-darkGray">{r.id_number ?? '—'}</td>
                    <td className="py-3 px-4 text-darkGray">{r.region ?? '—'}</td>
                    <td className="py-3 px-4 text-darkGray">{r.governorate ?? '—'}</td>
                    <td className="py-3 px-4 text-darkGray whitespace-nowrap">{roleLabel(r.role)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${DECISION_META[r.decision].className}`}>
                        {DECISION_META[r.decision].label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-darkGray text-xs whitespace-nowrap">{formatDate(r.responded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
