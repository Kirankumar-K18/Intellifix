import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { complaintAPI, notifAPI } from '../../services/api'
import { Layout, StatCard, Card, Badge, PriorityBadge, Button, Spinner, EmptyState } from '../../components/common/UI'
import { T } from "../../styles/theme";

export default function UserDashboard() {
  const { user }   = useAuth()
  const [complaints, setC] = useState([])
  const [notifs,     setN] = useState([])
  const [loading,    setL] = useState(true)

  useEffect(() => {
    Promise.all([complaintAPI.getMine(), notifAPI.getAll()])
      .then(([cr, nr]) => { setC(cr.data); setN(nr.data.results || nr.data) })
      .catch(() => {})
      .finally(() => setL(false))
  }, [])

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>

  const total     = complaints.length
  const resolved  = complaints.filter(c => c.status === 'resolved').length
  const pending   = complaints.filter(c => c.status === 'pending').length
  const inProg    = complaints.filter(c => c.status === 'in_progress').length
  const unreadN   = notifs.filter(n => !n.is_read).length
  const recent    = [...complaints].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5)

  return (
    <Layout
      title="My Dashboard"
      action={<Link to="/user/submit"><Button>Submit Complaint</Button></Link>}
    >
      {/* Welcome banner */}
      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.1))', border:`1px solid ${T.brd}`, borderRadius:14, padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Welcome, {user?.name}</div>
          <div style={{ fontSize:13, color:T.tx2 }}>Track your complaints and stay updated on resolutions.</div>
        </div>
        {unreadN > 0 && (
          <div style={{ background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#ef4444' }}>{unreadN}</div>
            <div style={{ fontSize:10, color:'#ef4444', fontWeight:600 }}>UNREAD</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard
          label="Total Complaints"
          value={total}
          color={T.pri}
        />

        <StatCard
          label="Resolved"
          value={resolved}
          color={T.ok}
          sub={`${total ? Math.round(resolved / total * 100) : 0}% resolution rate`}
        />

        <StatCard
          label="Pending"
          value={pending}
          color={T.warn}
        />

        <StatCard
          label="In Progress"
          value={inProg}
          color={T.acc2}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Recent complaints */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>Recent Complaints</div>
            <Link to="/user/complaints" style={{ fontSize:11, color:T.pri }}>View all →</Link>
          </div>
          {recent.length === 0
            ? <EmptyState
                title="No complaints yet"
                subtitle="Submit your first complaint"
              />
            : recent.map(c => (
              <Link key={c.id} to={`/user/complaints/${c.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${T.brd}`, cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <PriorityBadge priority={c.priority} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize:10, color:T.tx3 }}>{c.department_name} · {new Date(c.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <Badge type={c.status} />
                </div>
              </Link>
            ))}
        </Card>

        {/* Notifications */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>Notifications {unreadN > 0 && <span style={{ background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8, marginLeft:4 }}>{unreadN}</span>}</div>
            <button onClick={() => notifAPI.markAllRead().then(() => setN(n => n.map(x => ({...x, is_read:true}))))}
              style={{ fontSize:11, color:T.pri, background:'none', border:'none', cursor:'pointer' }}>
              Mark all read
            </button>
          </div>
          {notifs.length === 0
            ? <EmptyState title="No notifications" />
            : notifs.slice(0,6).map(n => (
              <div key={n.id} style={{ padding:'9px 0', borderBottom:`1px solid ${T.brd}`, borderLeft: n.is_read ? 'none' : `2px solid ${T.pri}`, paddingLeft: n.is_read ? 0 : 10 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{n.title}</div>
                <div style={{ fontSize:11, color:T.tx2 }}>{n.message}</div>
                <div style={{ fontSize:10, color:T.tx3, marginTop:3 }}>{new Date(n.created_at).toLocaleDateString('en-IN')}</div>
              </div>
            ))}
        </Card>
      </div>
    </Layout>
  )
}
