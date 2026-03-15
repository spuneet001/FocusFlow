import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--accent)',
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: 1,
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      FocusFlow
    </div>
  )
}

function AppShell() {
  const { token, fetchMe } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
  }, [token])

  if (!token) return <Navigate to="/login" replace />

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
  const { initializing, init, token } = useAuthStore()

  useEffect(() => {
    init()
  }, [])

  if (initializing) return <SplashScreen />

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: 13 },
        }}
      />
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/tasks" replace /> : <AuthPage />} />
        <Route path="/*"     element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}
