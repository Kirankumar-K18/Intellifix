import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { complaintAPI, analyticsAPI } from '../../services/api'
import { Layout, StatCard, Card, Badge, PriorityBadge, Spinner, EmptyState } from '../../components/common/UI'

const T = { pri:'#3b82f6', ok:'#10b981', warn:'#f59e0b', err:'#ef4444', tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b', brd:'#2a3a5c', acc2:'#8b5cf6' }

export default function DeptDashboard() {
  const { user }  = useAuth()
  const [data,    setData]    = useState(null)
  const [topComplaints, setTC] = useState([])
  const [loading, setL]       = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsAPI.department(),
      complaintAPI.getAll('ordering=-priority_score&page_size=5'),
    ])
      .then(([ar, cr]) => {
        setData(ar.data)
        setTC(cr.data.results || cr.data)
      })
      .catch(() => {})
      .finally(() => setL(false))
  }, [])

  if (loading) return <Layout title="Department Dashboard"><Spinner /></Layout>

  return (
    <Layout title="Department Dashboard">
      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.1))', border:`1px solid ${T.brd}`, borderRadius:14, padding:'18px 22px', marginBottom:22 }}>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:3 }}>Welcome, {user?.name?.split(' ')[0]} 👋</div>
        <div style={{ fontSize:12, color:T.tx2 }}>🏢 {user?.department_name} — Complaints sorted by AI priority score</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <StatCard label="Total Complaints" value={data?.total    ?? 0} icon="📋" color={T.pri} />
        <StatCard label="Pending"          value={data?.pending  ?? 0} icon="⏳" color={T.warn} />
        <StatCard label="In Progress"      value={data?.in_progress ?? 0} icon="🔧" color={T.acc2} />
        <StatCard label="Resolved"         value={data?.resolved ?? 0} icon="✅" color={T.ok}
          sub={`Avg ${data?.avg_resolution_hours ?? '—'} hrs`} />
      </div>

      {data?.avg_rating > 0 && (
        <Card style={{ marginBottom:22, display:'flex', alignItems:'center', gap:16 }}>
          <div>
            <div style={{ fontSize:11, color:T.tx3, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Department Rating</div>
            <div style={{ fontSize:32, fontWeight:800, color:'#fbbf24' }}>{'★'.repeat(Math.round(data.avg_rating))}{'☆'.repeat(5-Math.round(data.avg_rating))}</div>
            <div style={{ fontSize:13, color:T.tx2 }}>{data.avg_rating.toFixed(1)} / 5.0 average</div>
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Top priority complaints */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>🔥 High Priority Queue</div>
            <Link to="/department/complaints" style={{ fontSize:11, color:T.pri }}>View all →</Link>
          </div>
          {topComplaints.length === 0
            ? <EmptyState icon="✅" title="No pending complaints" />
            : topComplaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').slice(0,5).map(c => (
              <Link key={c.id} to={`/department/complaints/${c.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${T.brd}`, cursor:'pointer' }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:`${c.priority==='critical'?'rgba(220,38,38,.15)':c.priority==='high'?'rgba(239,68,68,.15)':'rgba(245,158,11,.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    {c.priority==='critical'?'🚨':c.priority==='high'?'🔴':'🟡'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize:10, color:T.tx3 }}>Score: {c.priority_score?.toFixed(0)} · {c.location}</div>
                  </div>
                  <Badge type={c.status} />
                </div>
              </Link>
            ))}
        </Card>

        {/* Priority breakdown */}
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>📊 By Priority</div>
          {(data?.by_priority || []).map(item => {
            const colors = { low:'#10b981', medium:'#f59e0b', high:'#ef4444', critical:'#dc2626' }
            const total  = data.total || 1
            return (
              <div key={item.priority} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, textTransform:'capitalize' }}>{item.priority}</span>
                  <span style={{ fontSize:12, fontWeight:700 }}>{item.count}</span>
                </div>
                <div style={{ height:8, background:'#141d35', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', background: colors[item.priority] || T.pri, width:`${(item.count/total)*100}%`, borderRadius:4, transition:'width .6s ease' }} />
                </div>
              </div>
            )
          })}
          {!data?.by_priority?.length && <EmptyState icon="📊" title="No data yet" />}
        </Card>
      </div>
    </Layout>
  )
}
