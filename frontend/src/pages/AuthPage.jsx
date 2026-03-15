import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const { login, register, loading } = useAuthStore()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }
        if (form.password.length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }
      }
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
        navigate('/tasks')
      } else {
        await register(form.name, form.email, form.password)
        toast.success('Account created! Please sign in.')
        setMode('login')
        setForm({ name: '', email: form.email, password: '', confirmPassword: '' })
      }
    } catch (err) {
      const msg = err.response?.data?.message
      if (msg) {
        toast.error(msg)
      } else if (err.request && !err.response) {
        toast.error('Cannot reach server. Please check your connection.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  function f(key, val) { setForm((p) => ({ ...p, [key]: val })) }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,108,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{
        background: 'var(--card)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: '40px 36px', width: 420, maxWidth: '92vw',
        boxShadow: '0 0 60px rgba(123,108,246,0.1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--white)' }}>
            Focus<span style={{ color: 'var(--accent)' }}>Flow</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </div>
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <Label>Full Name</Label>
              <input placeholder="Your name" value={form.name} onChange={(e) => f('name', e.target.value)} required />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <Label>Email</Label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => f('email', e.target.value)} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <Label>Password</Label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => f('password', e.target.value)} required />
          </div>
          {mode === 'register' && (
            <div style={{ marginBottom: 24 }}>
              <Label>Confirm Password</Label>
              <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => f('confirmPassword', e.target.value)} required />
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: 'var(--font-display)',
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text2)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>
}
