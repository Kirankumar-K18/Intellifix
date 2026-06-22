import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notifAPI } from '../../services/api'

/* ─── Color tokens ─────────────────────────────────────────────────────── */
const T = {
  bg:'#0a0e1a', bg2:'#0f1626', bg3:'#141d35',
  surf:'#1a2540', surf2:'#1e2d4a',
  brd:'#2a3a5c', brd2:'#354a6e',
  pri:'#3b82f6', acc:'#06b6d4', acc2:'#8b5cf6',
  ok:'#10b981', warn:'#f59e0b', err:'#ef4444',
  tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b',
}

/* ─── Badge ─────────────────────────────────────────────────────────────── */
const BADGE_COLORS = {
  pending:     { bg:'rgba(245,158,11,.15)',  color:'#f59e0b', border:'rgba(245,158,11,.3)'  },
  in_progress: { bg:'rgba(59,130,246,.15)', color:'#3b82f6', border:'rgba(59,130,246,.3)'  },
  resolved:    { bg:'rgba(16,185,129,.15)', color:'#10b981', border:'rgba(16,185,129,.3)'  },
  closed:      { bg:'rgba(100,116,139,.15)',color:'#64748b', border:'rgba(100,116,139,.3)' },
  rejected:    { bg:'rgba(239,68,68,.15)',  color:'#ef4444', border:'rgba(239,68,68,.3)'   },
  low:         { bg:'rgba(16,185,129,.15)', color:'#10b981', border:'rgba(16,185,129,.3)'  },
  medium:      { bg:'rgba(245,158,11,.15)', color:'#f59e0b', border:'rgba(245,158,11,.3)'  },
  high:        { bg:'rgba(239,68,68,.15)',  color:'#ef4444', border:'rgba(239,68,68,.3)'   },
  critical:    { bg:'rgba(220,38,38,.2)',   color:'#dc2626', border:'rgba(220,38,38,.4)'   },
  citizen:     { bg:'rgba(59,130,246,.15)', color:'#3b82f6', border:'rgba(59,130,246,.3)'  },
  department:  { bg:'rgba(139,92,246,.15)', color:'#8b5cf6', border:'rgba(139,92,246,.3)'  },
  admin:       { bg:'rgba(6,182,212,.15)',  color:'#06b6d4', border:'rgba(6,182,212,.3)'   },
}

export function Badge({ type, label }) {
  const c = BADGE_COLORS[type] || BADGE_COLORS.pending
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding:'2px 8px', borderRadius:6,
      fontSize:11, fontWeight:700, whiteSpace:'nowrap',
      background: c.bg, color: c.color, border:`1px solid ${c.border}`,
    }}>
      {label || type.replace('_', ' ')}
    </span>
  )
}

/* ─── Priority Badge ─────────────────────────────────────────────────────── */
const PRI_ICONS = { low:'🟢', medium:'🟡', high:'🔴', critical:'🚨' }
export function PriorityBadge({ priority }) {
  return <Badge type={priority} label={`${PRI_ICONS[priority] || ''} ${priority}`} />
}

/* ─── Stars ──────────────────────────────────────────────────────────────── */
export function StarRating({ value = 0, onChange, readOnly = false, size = 22 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          style={{
            fontSize: size, cursor: readOnly ? 'default' : 'pointer',
            color: n <= (hover || value) ? '#fbbf24' : T.brd2,
            transition: 'transform .1s',
            display: 'inline-block',
            transform: !readOnly && hover === n ? 'scale(1.2)' : 'scale(1)',
          }}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(n)}
        >★</span>
      ))}
    </div>
  )
}

/* ─── Button ─────────────────────────────────────────────────────────────── */
export function Button({ children, variant='primary', size='md', loading=false, style:s={}, ...props }) {
  const variants = {
    primary:  { background:T.pri,   color:'#fff', border:'none' },
    outline:  { background:'transparent', color:T.tx2, border:`1px solid ${T.brd}` },
    danger:   { background:T.err,   color:'#fff', border:'none' },
    success:  { background:T.ok,    color:'#fff', border:'none' },
    ghost:    { background:'transparent', color:T.tx2, border:'none' },
  }
  const sizes = {
    sm: { padding:'4px 10px', fontSize:11, borderRadius:7 },
    md: { padding:'8px 16px', fontSize:13, borderRadius:9 },
    lg: { padding:'11px 24px', fontSize:14, borderRadius:10 },
  }
  return (
    <button
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        fontFamily:'inherit', fontWeight:600, cursor: loading || props.disabled ? 'not-allowed':'pointer',
        transition:'all .15s', userSelect:'none',
        opacity: props.disabled || loading ? .5 : 1,
        ...variants[variant], ...sizes[size], ...s,
      }}
      onMouseEnter={e => { if (!props.disabled && !loading && variant==='primary') e.currentTarget.style.background='#2563eb' }}
      onMouseLeave={e => { if (!props.disabled && !loading && variant==='primary') e.currentTarget.style.background=T.pri }}
      {...props}
    >
      {loading ? <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/> : null}
      {children}
    </button>
  )
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
export function Input({ label, error, style:s={}, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.tx2, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>}
      <input
        style={{
          width:'100%', background:T.bg3, border:`1px solid ${error ? T.err : T.brd}`,
          borderRadius:9, padding:'9px 12px', color:T.tx, fontSize:13,
          fontFamily:'inherit', outline:'none', transition:'all .15s', ...s,
        }}
        onFocus={e => e.target.style.borderColor = T.pri}
        onBlur={e  => e.target.style.borderColor = error ? T.err : T.brd}
        {...props}
      />
      {error && <div style={{ fontSize:11, color:T.err, marginTop:4 }}>{error}</div>}
    </div>
  )
}

/* ─── Select ─────────────────────────────────────────────────────────────── */
export function Select({ label, error, children, style:s={}, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.tx2, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>}
      <select
        style={{
          width:'100%', background:T.bg3, border:`1px solid ${error ? T.err : T.brd}`,
          borderRadius:9, padding:'9px 12px', color:T.tx, fontSize:13,
          fontFamily:'inherit', outline:'none', transition:'all .15s',
          appearance:'none', cursor:'pointer', ...s,
        }}
        onFocus={e => e.target.style.borderColor = T.pri}
        onBlur={e  => e.target.style.borderColor = error ? T.err : T.brd}
        {...props}
      >{children}</select>
      {error && <div style={{ fontSize:11, color:T.err, marginTop:4 }}>{error}</div>}
    </div>
  )
}

/* ─── Textarea ───────────────────────────────────────────────────────────── */
export function Textarea({ label, error, style:s={}, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.tx2, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>}
      <textarea
        style={{
          width:'100%', background:T.bg3, border:`1px solid ${error ? T.err : T.brd}`,
          borderRadius:9, padding:'9px 12px', color:T.tx, fontSize:13,
          fontFamily:'inherit', outline:'none', transition:'all .15s',
          resize:'vertical', minHeight:90, ...s,
        }}
        onFocus={e => e.target.style.borderColor = T.pri}
        onBlur={e  => e.target.style.borderColor = error ? T.err : T.brd}
        {...props}
      />
      {error && <div style={{ fontSize:11, color:T.err, marginTop:4 }}>{error}</div>}
    </div>
  )
}

/* ─── Card ───────────────────────────────────────────────────────────────── */
export function Card({ children, style:s={}, ...props }) {
  return (
    <div style={{ background:T.surf, border:`1px solid ${T.brd}`, borderRadius:14, padding:20, ...s }} {...props}>
      {children}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
export function StatCard({ label, value, icon, color=T.pri, sub }) {
  return (
    <Card style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:11, color:T.tx3, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>
        {icon && <span style={{ fontSize:20 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:32, fontWeight:800, letterSpacing:-1, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.tx3 }}>{sub}</div>}
    </Card>
  )
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */
export function Spinner({ size=32 }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
      <div style={{ width:size, height:size, border:`3px solid ${T.brd}`, borderTopColor:T.pri, borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
    </div>
  )
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
export function EmptyState({ icon='📋', title='Nothing here yet', subtitle='' }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:T.tx3 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>{title}</div>
      {subtitle && <div style={{ fontSize:13 }}>{subtitle}</div>}
    </div>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth=520 }) {
  if (!open) return null
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, backdropFilter:'blur(4px)' }}
      onClick={e => e.target===e.currentTarget && onClose?.()}
    >
      <div style={{ background:T.bg2, border:`1px solid ${T.brd}`, borderRadius:16, padding:24, width:'100%', maxWidth, maxHeight:'88vh', overflowY:'auto', animation:'slideUp .25s ease' }}>
        {title && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div style={{ fontSize:17, fontWeight:700 }}>{title}</div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:T.tx3, fontSize:20, cursor:'pointer', padding:4, lineHeight:1 }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
const NAV_LINKS = {
  citizen: [
    { to:'/user', icon:'🏠', label:'Dashboard' },
    { to:'/user/submit', icon:'📝', label:'Submit Complaint' },
    { to:'/user/complaints', icon:'📋', label:'My Complaints' },
  ],

  worker: [
    { to:'/department', icon:'🏠', label:'Dashboard' },
    { to:'/department/complaints', icon:'📋', label:'My Complaints' },
    { to:'/worker/performance', icon:'⭐', label:'My Performance' },
  ],

  department_admin: [
    { to:'/department', icon:'🏠', label:'Dashboard' },
    { to:'/department/complaints', icon:'📋', label:'Complaints' },
    { to:'/department/workers', icon:'👷', label:'Workers' },
    { to:'/department/analytics', icon:'📊', label:'Analytics' },
  ],

  admin: [
    { to:'/admin', icon:'🏠', label:'Dashboard' },
    { to:'/admin/users', icon:'👥', label:'Users' },
    { to:'/admin/departments', icon:'🏢', label:'Departments' },
    { to:'/admin/complaints', icon:'📋', label:'All Complaints' },
    { to:'/admin/analytics', icon:'📊', label:'Analytics' },
  ],
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const location         = useLocation()
  const navigate         = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    notifAPI.unreadCount().then(r => setUnread(r.data.unread_count)).catch(() => {})
    const t = setInterval(() => {
      notifAPI.unreadCount().then(r => setUnread(r.data.unread_count)).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [user])

  const links = NAV_LINKS[user?.role] || []

  return (
    <aside style={{ width:220, minHeight:'100vh', background:T.bg2, borderRight:`1px solid ${T.brd}`, display:'flex', flexDirection:'column', position:'fixed', left:0, top:0, bottom:0, zIndex:100 }}>
      {/* Logo */}
      <div style={{ padding:'20px 16px', borderBottom:`1px solid ${T.brd}`, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🔧</div>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>Intelli<span style={{ color:T.pri }}>Fix</span></div>
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:'10px 0', overflowY:'auto' }}>
        <div style={{ padding:'6px 14px 3px', fontSize:9, fontWeight:700, color:T.tx3, letterSpacing:1, textTransform:'uppercase' }}>
          {
            user?.role === 'citizen'
              ? 'Citizen Portal'
              : user?.role === 'worker'
              ? 'Worker Portal'
              : user?.role === 'department_admin'
              ? 'Department Admin'
              : 'Admin Panel'
          }
        </div>
        {links.map(link => {
          const active = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                color: active ? T.pri : T.tx2,
                background: active ? 'rgba(59,130,246,.12)' : 'transparent',
                borderLeft: `2px solid ${active ? T.pri : 'transparent'}`,
                textDecoration:'none', fontSize:13, fontWeight:500,
                transition:'all .15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.color=T.tx; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.tx2; } }}
            >
              <span style={{ fontSize:16, width:18, textAlign:'center' }}>{link.icon}</span>
              {link.label}
              {link.label === 'Dashboard' && unread > 0 && (
                <span style={{ marginLeft:'auto', background:T.err, color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8 }}>{unread}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding:12, borderTop:`1px solid ${T.brd}` }}>
        <div
          style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:9, background:T.surf, cursor:'pointer', transition:'all .15s' }}
          onClick={async () => { await logout(); navigate('/login') }}
          onMouseEnter={e => e.currentTarget.style.background=T.surf2}
          onMouseLeave={e => e.currentTarget.style.background=T.surf}
        >
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:600 }}>{user?.name?.split(' ').slice(0,2).join(' ')}</div>
            <div style={{ fontSize:10, color:T.tx3, textTransform:'capitalize' }}>{user?.role} · Logout</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ─── Page Layout ────────────────────────────────────────────────────────── */
export function Layout({ title, children, action }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ flex:1, marginLeft:220, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <div style={{ height:56, background:T.bg2, borderBottom:`1px solid ${T.brd}`, display:'flex', alignItems:'center', padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:50 }}>
          <h1 style={{ fontSize:17, fontWeight:700, flex:1 }}>{title}</h1>
          {action}
        </div>
        {/* Content */}
        <div style={{ padding:24, flex:1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}

/* ─── Table ──────────────────────────────────────────────────────────────── */
export function Table({ columns, data, onRowClick, emptyIcon, emptyTitle }) {
  if (!data?.length) return <EmptyState icon={emptyIcon} title={emptyTitle} />
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{ textAlign:'left', padding:'9px 12px', fontSize:10, fontWeight:600, color:T.tx3, textTransform:'uppercase', letterSpacing:.5, borderBottom:`1px solid ${T.brd}`, whiteSpace:'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.02)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {columns.map(c => (
                <td key={c.key} style={{ padding:'11px 12px', borderBottom:`1px solid ${T.brd}`, verticalAlign:'middle', color:T.tx, ...(c.style||{}) }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
