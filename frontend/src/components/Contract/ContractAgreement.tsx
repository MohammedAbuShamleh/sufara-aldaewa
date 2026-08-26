import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../services/auth'
import { canViewAllReports } from '../../constants/roles'
import '../../styles/theme.css'

interface Clause {
  title: string
  body?: string
  items?: string[]
}

interface ContractData {
  version: string
  title: string
  subtitle: string
  period: { start: string; end: string; label: string }
  clauses: Clause[]
  acknowledgement: string
  decline_notice: string
  decision: 'agreed' | 'declined' | 'pending'
  agreed: boolean
  responded_at: string | null
  signatory: { name: string; id_number: string | null }
}

/**
 * شاشة عقد الكفالة الإلكتروني — تُعرض بعد تسجيل الدخول مباشرةً لكل مستخدم
 * لم يوافق بعد على النسخة الحالية، ولا يمكن تجاوزها إلا بالضغط على «موافق».
 *
 * «غير موافق» يوثّق الرفض ولا يفتح النظام، لكنه لا يغلق الباب: يبقى بإمكان
 * المستخدم العدول والموافقة من الشاشة نفسها.
 *
 * نص العقد يأتي كاملاً من الخادم (config/contract.php) ولا نسخة منه هنا،
 * حتى يبقى المعروض مطابقاً للنص الذي يُوثَّق الرد عليه.
 */
function ContractAgreement() {
  const { user, logout, setContractDecision } = useAuth()
  const navigate = useNavigate()

  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState<'agree' | 'decline' | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [confirmingDecline, setConfirmingDecline] = useState(false)
  // نتتبّع الرفض محلياً حتى تتبدّل الشاشة فوراً بعد تسجيله
  const [declined, setDeclined] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get('/contract')
      .then((response) => {
        if (cancelled) return
        const data: ContractData = response.data
        // نص العقد يأتي من config/contract.php على الخادم. إن لم يُرفع الملف أو
        // كانت الإعدادات مكيّشة من قبل إضافته، يرجع الرد بحقول فارغة — نُظهر
        // رسالة صريحة بدل الانهيار على clauses ثم صفحة بيضاء.
        if (!data || !Array.isArray(data.clauses) || data.clauses.length === 0) {
          setLoadError(
            'تعذّر تحميل بنود العقد من الخادم. غالباً لم يُرفع ملف إعدادات العقد ' +
              '(config/contract.php) أو أن ذاكرة الإعدادات لم تُحدَّث بعد. ' +
              'يرجى إبلاغ مسؤول النظام.',
          )
          return
        }
        setContract(data)
        setDeclined(data.decision === 'declined')
        // من وافق سابقاً لا يُحبس هنا — تحديث الحالة يُخرجه عبر البوابة لوجهته المعتادة.
        if (data.agreed) {
          setContractDecision('agreed', data.responded_at)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('تعذّر تحميل نص العقد. يرجى تحديث الصفحة والمحاولة مرة أخرى.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [setContractDecision])

  const handleAgree = async () => {
    if (!accepted || submitting) return
    setSubmitError('')
    setSubmitting('agree')
    try {
      const response = await api.post('/contract/agree')
      setContractDecision('agreed', response.data?.responded_at ?? null)
      navigate(canViewAllReports(user?.role) ? '/dashboard' : '/form', { replace: true })
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'تعذّر توثيق الموافقة. يرجى المحاولة مرة أخرى.')
      setSubmitting(null)
    }
  }

  const handleDecline = async () => {
    if (submitting) return
    setSubmitError('')
    setSubmitting('decline')
    try {
      const response = await api.post('/contract/decline')
      setContractDecision('declined', response.data?.responded_at ?? null)
      setDeclined(true)
      setConfirmingDecline(false)
      setAccepted(false)
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'تعذّر تسجيل عدم الموافقة. يرجى المحاولة مرة أخرى.')
    } finally {
      setSubmitting(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  // تاريخ اليوم بالميلادي — يُطبع في خانة «التاريخ» أسفل بنود العقد.
  const today = new Date()
  const todayLabel = [
    String(today.getDate()).padStart(2, '0'),
    String(today.getMonth() + 1).padStart(2, '0'),
    today.getFullYear() + 'م',
  ].join(' / ')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-dark to-slate-900 text-white/70">
        جاري تحميل العقد...
      </div>
    )
  }

  if (loadError || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-teal-dark to-slate-900 px-4 text-center">
        <p className="text-coral-light text-sm max-w-sm">{loadError || 'تعذّر تحميل العقد.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 transition-all"
        >
          إعادة المحاولة
        </button>
        <button type="button" onClick={handleLogout} className="text-white/40 hover:text-white/70 text-xs">
          تسجيل الخروج
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-dark to-slate-900 px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gold/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 shadow-2xl">
            <img src="/logo.jpeg" alt="شعار الجمعية" className="w-11 h-11 object-contain rounded-lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {contract.title}
          </h1>
          <p className="text-sm text-gold mt-2 font-semibold">{contract.subtitle}</p>
        </div>

        {/* لافتة عدم الموافقة المسجّلة */}
        {declined && (
          <div className="mb-5 rounded-2xl bg-coral/15 border border-coral/30 px-5 py-4 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-coral-light mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-bold text-coral-light mb-1">تم تسجيل عدم موافقتك</p>
              <p className="text-xs text-white/70 leading-relaxed">{contract.decline_notice}</p>
            </div>
          </div>
        )}

        {/* Contract Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* شريط المدة والطرف الثاني */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-4 bg-white/[0.04] border-b border-white/10">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
              <svg className="w-4 h-4 text-teal-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">{contract.period?.label}</span>
            </div>
            <div className="text-xs text-white/50">
              الطرف الثاني: <span className="font-bold text-white/80">{contract.signatory?.name}</span>
              {contract.signatory?.id_number && (
                <span className="text-white/40"> — {contract.signatory.id_number}</span>
              )}
            </div>
          </div>

          {/* البنود */}
          <div className="max-h-[52vh] overflow-y-auto px-5 sm:px-7 py-6 space-y-5">
            {(contract.clauses ?? []).map((clause, index) => (
              <section key={index}>
                <h2 className="flex items-start gap-2.5 text-sm sm:text-base font-bold text-teal-light mb-2">
                  <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg bg-teal/20 border border-teal/30 flex items-center justify-center text-[11px] text-white/80">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{clause.title}</span>
                </h2>
                {clause.body && (
                  <p className="text-sm text-white/70 leading-loose" style={{ paddingInlineStart: '2.125rem' }}>
                    {clause.body}
                  </p>
                )}
                {clause.items && (
                  <ol
                    className="text-sm text-white/70 leading-loose space-y-2 list-decimal"
                    style={{ paddingInlineStart: '3.25rem' }}
                  >
                    {clause.items.map((item, i) => (
                      <li key={i} className="marker:text-teal-light marker:font-bold">
                        {item}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}

            {/* سطر التاريخ */}
            <div className="pt-3 border-t border-white/10 text-sm text-white/60">
              التاريخ: <span className="font-semibold text-white/85">{todayLabel}</span>
            </div>
          </div>

          {/* الموافقة / عدم الموافقة */}
          <div className="px-5 sm:px-7 py-5 bg-white/[0.04] border-t border-white/10 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border-white/25 bg-white/10 accent-teal focus:ring-2 focus:ring-teal/50 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-white/70 leading-relaxed group-hover:text-white/90 transition-colors">
                {contract.acknowledgement}
              </span>
            </label>

            {submitError && (
              <div className="flex items-center gap-2 text-sm bg-coral/15 border border-coral/25 rounded-xl px-4 py-3 text-coral-light">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {submitError}
              </div>
            )}

            {confirmingDecline ? (
              <div className="rounded-xl bg-coral/10 border border-coral/25 px-4 py-4 space-y-3">
                <p className="text-sm text-white/85 font-semibold">تأكيد عدم الموافقة</p>
                <p className="text-xs text-white/60 leading-relaxed">
                  سيتم تسجيل عدم موافقتك على العقد، ولن تتمكّن من استخدام النظام. يمكنك العدول والموافقة لاحقاً،
                  لكن قد تحذف الإدارة حسابات غير الموافقين.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={submitting !== null}
                    className="flex-1 rounded-lg bg-coral hover:bg-coral/90 text-white font-bold py-2.5 text-sm disabled:opacity-60 transition-all"
                  >
                    {submitting === 'decline' ? 'جاري التسجيل...' : 'نعم، غير موافق'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDecline(false)}
                    disabled={submitting !== null}
                    className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 font-semibold py-2.5 text-sm border border-white/10 disabled:opacity-60 transition-all"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={handleAgree}
                  disabled={!accepted || submitting !== null}
                  className="flex-1 rounded-xl bg-gradient-to-r from-teal to-teal-light text-white font-bold py-3.5 text-sm shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
                >
                  {submitting === 'agree' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      جاري توثيق الموافقة...
                    </span>
                  ) : (
                    'موافق'
                  )}
                </button>
                {!declined && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDecline(true)}
                    disabled={submitting !== null}
                    className="flex-1 sm:flex-none sm:px-8 rounded-xl bg-coral/15 hover:bg-coral/25 text-coral-light font-bold py-3.5 text-sm border border-coral/30 disabled:opacity-50 transition-all"
                  >
                    غير موافق
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={submitting !== null}
                  className="sm:flex-none sm:px-6 rounded-xl bg-white/[0.07] hover:bg-white/15 text-white/70 hover:text-white font-semibold py-3.5 text-sm border border-white/10 disabled:opacity-50 transition-all"
                >
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-white/25 text-[11px] mt-5">نسخة العقد: {contract.version}</p>
      </div>
    </div>
  )
}

export default ContractAgreement
