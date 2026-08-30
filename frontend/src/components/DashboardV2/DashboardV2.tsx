import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../Layout/Header'
import { useAuth } from '../../services/auth'
import { canManageUsers } from '../../constants/roles'
import ReportsTab from './ReportsTab'
import UsersTab from './UsersTab'
import ContractTab from './ContractTab'
import '../../styles/theme.css'

type TabKey = 'reports' | 'users' | 'contract'

const TAB_STORAGE = 'dashboard2:tab'

/**
 * لوحة الإدارة — نسخة ثانية للمقارنة (المسار /dashboard/v2).
 *
 * الفرق الجوهري عن الصفحة الحالية: الوظائف الثلاث (التقارير، المستخدمون، العقد)
 * كانت مكدّسة في تمريرة واحدة بثلاثة جداول وثلاثة أشرطة فلترة ونحو خمسة وعشرين
 * عنصر تحكّم. هنا كلٌّ في تبويب مستقل، فلا يظهر إلا جدول واحد وشريط فلترة واحد.
 *
 * الصفحة الحالية (/dashboard) لم تُمسّ — الاثنتان تعملان جنباً إلى جنب حتى يُبتّ
 * في أيّهما تبقى.
 */
export default function DashboardV2() {
  const { user } = useAuth()
  const isAdmin = canManageUsers(user?.role)

  const [tab, setTab] = useState<TabKey>(() => {
    const saved = localStorage.getItem(TAB_STORAGE) as TabKey | null
    return saved === 'users' || saved === 'contract' ? saved : 'reports'
  })

  // غير الأدمن لا يملك تبويبَي المستخدمين والعقد — نعيده للتقارير حتى لو
  // كان التخزين يحمل تبويباً محفوظاً من حساب آخر على نفس المتصفح.
  const activeTab: TabKey = !isAdmin && tab !== 'reports' ? 'reports' : tab

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE, activeTab)
  }, [activeTab])

  const TABS: { key: TabKey; label: string; adminOnly?: boolean }[] = [
    { key: 'reports', label: 'التقارير' },
    { key: 'users', label: 'طلبة العلم والدعاة', adminOnly: true },
    { key: 'contract', label: 'عقد الكفالة', adminOnly: true },
  ]

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-darkGray">لوحة الإدارة</h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'reports' && 'متابعة الأنشطة الشهرية وتصديرها'}
              {activeTab === 'users' && 'إضافة الحسابات وتعديلها وتعطيلها'}
              {activeTab === 'contract' && 'قرارات المستخدمين تجاه النسخة الحالية من العقد'}
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-teal underline underline-offset-4 transition-colors"
          >
            العودة للشكل الحالي
          </Link>
        </div>

        {/* التبويبات */}
        {visibleTabs.length > 1 && (
          <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
            {visibleTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all ${
                  activeTab === t.key
                    ? 'border-teal text-teal'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'reports' && <ReportsTab role={user?.role} />}
        {activeTab === 'users' && isAdmin && <UsersTab />}
        {activeTab === 'contract' && isAdmin && <ContractTab />}
      </div>
    </div>
  )
}
