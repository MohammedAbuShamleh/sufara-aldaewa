import { useAuth } from '../../services/auth'
import { useNavigate } from 'react-router-dom'
import '../../styles/theme.css'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-dark to-teal text-white shadow-xl">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-light/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-cyan/15 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-4 sm:px-6 py-4 md:py-5">
        <div className="flex items-center gap-4">
          <div className="relative group flex-shrink-0">
            <img
              src="/logo.jpeg"
              alt="شعار الجمعية"
              className="h-12 w-12 md:h-14 md:w-14 object-contain rounded-xl bg-white/10 p-1.5 shadow-lg ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base md:text-xl font-extrabold text-white tracking-tight">
              نظام متابعة الأنشطة الدعوية
            </h1>
            <p className="text-xs text-white/50 mt-0.5 font-medium hidden sm:block">
              لوحة تحكم المشرف
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {user && (
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 border border-white/10">
              <div className="w-7 h-7 rounded-md bg-gold/20 flex items-center justify-center text-xs font-bold text-gold border border-gold/30">
                {user.name?.charAt(0) || '؟'}
              </div>
              <span className="text-xs font-semibold text-white/90">{user.name}</span>
            </div>
          )}
          <button
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white hover:text-teal-dark text-xs font-semibold transition-all duration-200 border border-white/15"
            onClick={() => navigate('/form')}
          >
            📝 النموذج
          </button>
          <button
            className="px-3.5 py-1.5 rounded-lg bg-coral/80 hover:bg-coral text-xs font-semibold transition-all duration-200 border border-coral/50"
            onClick={handleLogout}
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
