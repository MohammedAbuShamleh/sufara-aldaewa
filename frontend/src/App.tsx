import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Auth/Login'
import Dashboard from './components/Dashboard/Dashboard'
import PreacherProfile from './components/Dashboard/PreacherProfile'
import MultiStepForm from './components/Form/MultiStepForm'
import ContractAgreement from './components/Contract/ContractAgreement'
import { AuthProvider, useAuth } from './services/auth'
import { canViewReports, canViewAllReports } from './constants/roles'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // بوابة العقد: لا شيء في النظام متاح قبل التوقيع الإلكتروني على النسخة الحالية.
  if (!user.contract_agreed) {
    return <Navigate to="/contract" replace />
  }

  return <>{children}</>
}

// صفحة العقد نفسها: تتطلب تسجيل دخول فقط، ومن وقّع سابقاً لا يعود إليها.
function ContractRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.contract_agreed) {
    return <Navigate to={canViewAllReports(user.role) ? '/dashboard' : '/form'} replace />
  }

  return <ContractAgreement />
}

// لوحة التقارير: متاحة لكل أدوار المشرفين (بنطاق كلٌّ حسب صلاحيته)
function ReportsRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.contract_agreed) {
    return <Navigate to="/contract" replace />
  }

  if (!canViewReports(user.role)) {
    return <Navigate to="/form" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/contract" element={<ContractRoute />} />
          <Route
            path="/dashboard"
            element={
              <ReportsRoute>
                <Dashboard />
              </ReportsRoute>
            }
          />
          <Route
            path="/dashboard/preacher/:id"
            element={
              <ReportsRoute>
                <PreacherProfile />
              </ReportsRoute>
            }
          />
          <Route
            path="/form"
            element={
              <ProtectedRoute>
                <MultiStepForm />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<ProtectedRoute><Navigate to="/form" replace /></ProtectedRoute>} />
          {/* أي مسار غير معروف يعود للجذر بدل أن يعرض صفحة بيضاء بلا تفسير */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
