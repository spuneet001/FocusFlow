import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store'
import Sidebar from './components/layout/Sidebar'
import AuthPage from './pages/AuthPage'
import TasksPage from './pages/TasksPage'
import AgentPage from './pages/AgentPage'
import ReportPage from './pages/ReportPage'
import SubscriptionPage from './pages/SubscriptionPage'
import ProfilePage from './pages/ProfilePage'
import './styles/global.css'

function AppShell() {
  const { token, fetchMe } = useAuthStore()
  const location = useLocation()
  const isAuth = location.pathname === '/login'

  useEffect(() => {
    if (token) fetchMe()
  }, [token])

  if (!token && !isAuth) return <Navigate to="/login" replace />
  if (token && isAuth) return <Navigate to="/tasks" replace />

  if (isAuth) return <AuthPage />

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/tasks"        element={<TasksPage />} />
          <Route path="/agent"        element={<AgentPage />} />
          <Route path="/report"       element={<ReportPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/profile"      element={<ProfilePage />} />
          <Route path="*"             element={<Navigate to="/tasks" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: 13 },
        }}
      />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/*"     element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}
