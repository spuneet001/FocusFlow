import React from 'react'

// ── Button ────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', full, loading, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center',
    border: 'none', borderRadius: 8, cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-body)', fontWeight: 600, transition: 'all 0.15s',
    width: full ? '100%' : undefined, opacity: props.disabled || loading ? 0.6 : 1,
  }
  const sizes = { sm: '7px 12px', md: '9px 18px', lg: '12px 24px' }
  const fontSizes = { sm: 12, md: 13, lg: 15 }
  const variants = {
    primary:  { background: 'var(--accent)',    color: '#fff' },
    ghost:    { background: 'transparent',      color: 'var(--text2)', border: '1px solid var(--border)' },
    success:  { background: 'var(--green-s)',   color: 'var(--green)' },
    danger:   { background: 'var(--red-s)',     color: 'var(--red)' },
    gold:     { background: 'var(--gold-s)',    color: 'var(--gold)' },
  }
  return (
    <button style={{ ...base, ...variants[variant], padding: sizes[size], fontSize: fontSizes[size] }} {...props}>
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style, glow, onClick, className }) {
  return (
    <div onClick={onClick} className={className} style={{
      background: 'var(--card)', border: `1px solid ${glow ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: '20px 22px',
      boxShadow: glow ? '0 0 20px var(--accent-s2)' : 'none',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, children, title, width = 480 }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(6px)', padding: 16, minHeight: '100vh',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{
        background: 'var(--card)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: 28, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow)',
        margin: 'auto',
      }}>
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--white)' }}>
              {title}
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: 18,
              cursor: 'pointer', padding: '2px 6px', lineHeight: 1, borderRadius: 6,
            }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'purple' }) {
  const colors = {
    purple: { bg: 'var(--accent-s)',  text: 'var(--accent)' },
    green:  { bg: 'var(--green-s)',   text: 'var(--green)' },
    gold:   { bg: 'var(--gold-s)',    text: 'var(--gold)' },
    red:    { bg: 'var(--red-s)',     text: 'var(--red)' },
    muted:  { bg: 'rgba(152,152,184,0.12)', text: 'var(--text2)' },
  }
  const c = colors[color] || colors.purple
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid transparent`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

// ── Label ─────────────────────────────────────────────────────────────────
export function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <div style={{ height: 1, background: 'var(--border)', margin: '16px 0', ...style }} />
}

// ── Page Header ───────────────────────────────────────────────────────────
export function PageHeader({ title, sub, action }) {
  return (
    <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--white)', letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        {sub && <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, color = 'var(--accent)', icon }) {
  return (
    <Card style={{ flex: 1, textAlign: 'center', padding: '16px 12px' }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>}
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
    </Card>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
export function Empty({ icon = '📭', message, action }) {
  return (
    <Card style={{ textAlign: 'center', padding: 48 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: 'var(--text2)', marginBottom: action ? 16 : 0 }}>{message}</div>
      {action}
    </Card>
  )
}
