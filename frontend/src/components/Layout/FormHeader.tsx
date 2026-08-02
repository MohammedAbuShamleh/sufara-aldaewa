import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../services/auth'
import { canViewReports } from '../../constants/roles'
import '../../styles/theme.css'

function FormHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // أصحاب الأدوار الإدارية (مسؤول فريق/محافظة…) لهم طبيعة مزدوجة:
  // يعبّئون نموذجهم الميداني هنا، ويتابعون إنجازات فريقهم عبر لوحة التقارير.
  const showReportsToggle = canViewReports(user?.role)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-dark to-teal text-white">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-light/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-cyan/15 rounded-full blur-[60px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 sm:px-6 py-4 md:py-5">
        <div className="flex items-center gap-4">
          <div className="relative group flex-shrink-0">
            <img
              src="/logo.jpeg"
              alt="شعار الجمعية"
              className="h-12 w-12 md:h-14 md:w-14 object-contain rounded-xl bg-white/10 p-1.5 shadow-lg ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:ring-white/35"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base md:text-xl font-extrabold text-white tracking-tight truncate">
              نظام متابعة الأنشطة الدعوية
            </h1>
            <p className="text-xs text-white/50 mt-0.5 font-medium hidden sm:block">
              توثيق الدروس والخطب والجولات بسهولة
            </p>
          </div>
        </div>

        {user && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-teal-light border border-white/10">
                {user.name?.charAt(0) || '؟'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                <span className="text-[10px] text-white/40 leading-tight">{user.region || 'بدون منطقة'}</span>
              </div>
            </div>
            {showReportsToggle && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                title="عرض إنجازات فريقك ومتابعة التقارير"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white hover:text-teal-dark text-xs font-semibold transition-all duration-200 border border-white/15"
              >
                📊 لوحة التقارير
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-coral/80 text-xs font-semibold transition-all duration-200 border border-white/10 hover:border-coral/50"
            >
              خروج
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default FormHeader
