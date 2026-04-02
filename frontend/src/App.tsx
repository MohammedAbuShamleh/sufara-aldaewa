import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Auth/Login'
import Dashboard from './components/Dashboard/Dashboard'
import PreacherProfile from './components/Dashboard/PreacherProfile'
import MultiStepForm from './components/Form/MultiStepForm'
import { AuthProvider, useAuth } from './services/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
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
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/preacher/:id"
            element={
              <AdminRoute>
                <PreacherProfile />
              </AdminRoute>
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
