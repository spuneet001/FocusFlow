import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { useState } from 'react'

const NAV = [
  { to: '/tasks',        icon: '☑️',  label: 'Tasks' },
  { to: '/agent',        icon: '🤖',  label: 'AI Agent',       pro: true },
  { to: '/report',       icon: '📊',  label: 'Report' },
  { to: '/profile',      icon: '👤',  label: 'Profile' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const isPro = user?.plan === 'PRO' || user?.plan === 'PREMIUM'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop">
        {/* Logo */}
        <div style={{ padding: '0 22px 32px', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--white)' }}>
          Focus<span style={{ color: 'var(--accent)' }}>Flow</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 22px',
              color: isActive ? 'var(--white)' : 'var(--text2)',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--accent-s)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none', fontSize: 14, transition: 'all 0.15s',
            })}>
              <span>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.pro && isPro && (
                <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>PRO</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: '20px 22px', borderTop: '1px solid var(--border)' }}>
          <div
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer', marginBottom: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: user?.profilePictureUrl
                  ? `url(${user.profilePictureUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--accent), var(--green))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: user?.profilePictureUrl ? 0 : 12, color: '#fff', fontWeight: 700,
                border: '2px solid var(--border2)',
              }}>
                {!user?.profilePictureUrl && (user?.name?.[0]?.toUpperCase() || '?')}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{user?.name}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, paddingLeft: 38 }}>
              {user?.plan || 'FREE'} PLAN
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 7, padding: '7px 14px',
            color: 'var(--text2)', fontSize: 12, cursor: 'pointer', width: '100%',
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-tab-bar">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
            <span className="mobile-tab-icon">{n.icon}</span>
            <span className="mobile-tab-label">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
