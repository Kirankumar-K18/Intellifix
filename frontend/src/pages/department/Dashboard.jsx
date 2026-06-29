import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { complaintAPI, analyticsAPI, notifAPI } from '../../services/api'
import { Layout, StatCard, Card, Badge, PriorityBadge, Spinner, EmptyState } from '../../components/common/UI'
import { authAPI } from '../../services/api'
import { T } from "../../styles/theme";

export default function DeptDashboard() {
  const { user } = useAuth()
  const isWorker =
    user?.role === 'worker' ||
    user?.user_type === 'worker' ||
    user?.is_worker === true
  const [data,    setData]    = useState(null)
  const [topComplaints, setTC] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setL]       = useState(true)
  const [workers, setWorkers] = useState([])

  useEffect(() => {

    if (isWorker) {

      Promise.all([
        complaintAPI.getAll(),
        complaintAPI.getFeedback(),
        notifAPI.getAll()
      ])
        .then(([cr, fr, nr]) => {
          setTC(cr.data.results || cr.data)

          const complaints = cr.data.results || cr.data
          const feedbacks = fr.data.results || fr.data
          const notifs = nr.data.results || nr.data
          setNotifications(notifs)

          setData({
            total: complaints.length,
            pending: complaints.filter(c => c.status === 'pending').length,
            in_progress: complaints.filter(c => c.status === 'in_progress').length,
            resolved: complaints.filter(
              c => c.status === 'resolved' || c.status === 'closed'
            ).length,
            feedback_count: feedbacks.length,
            avg_rating:
              feedbacks.length > 0
                ? feedbacks.reduce((s, f) => s + f.rating, 0) /
                  feedbacks.length
                : 0
          })
        })
        .finally(() => setL(false))

    } else {

      Promise.all([
          analyticsAPI.department(),
          complaintAPI.getAll('ordering=-priority_score&page_size=5'),
          authAPI.getUsers('role=worker'),
          notifAPI.getAll()
      ])
      .then(([ar, cr, wr, nr]) => {
          setData(ar.data)
          setTC(cr.data.results || cr.data)
          setWorkers(wr.data.results || wr.data)

          const notifs = nr.data.results || nr.data
          setNotifications(notifs)
        })
        .finally(() => setL(false))
    }

  }, [isWorker])

  if (loading) return <Layout title="Department Dashboard"><Spinner /></Layout>

  return (
    <Layout title={isWorker ? "Worker Dashboard" : "Department Dashboard"}>
      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.1))', border:`1px solid ${T.brd}`, borderRadius:14, padding:'18px 22px', marginBottom:22 }}>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:3 }}>Welcome, {user?.name?.split(' ')[0]} 👋</div>
        <div style={{ fontSize:12, color:T.tx2 }}>{isWorker? "👷 Worker Portal": `🏢 ${user?.department_name}`} — Complaints sorted by AI priority score</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <StatCard
          label={isWorker ? "Assigned" : "Total Complaints"}
          value={data?.total ?? 0}
          icon="📋"
          color={T.pri}
        />
        <StatCard label="Pending"          value={data?.pending  ?? 0} icon="⏳" color={T.warn} />
        <StatCard label="In Progress"      value={data?.in_progress ?? 0} icon="🔧" color={T.acc2} />
        <StatCard label="Resolved"         value={data?.resolved ?? 0} icon="✅" color={T.ok}
          sub={`Avg ${data?.avg_resolution_hours ?? '—'} hrs`} />
      </div>
      {isWorker && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 20
          }}
        >
          {/* My Performance */}
          <Card>
            <h3>⭐ My Performance</h3>

            <p>
              Average Rating:{' '}
              {data?.avg_rating?.toFixed?.(1) || '0.0'} ⭐
            </p>

            <p>
              Feedback Count:{' '}
              {data?.feedback_count || 0}
            </p>

            <p>
              Resolution Rate:{' '}
              {data?.total
                ? Math.round((data.resolved / data.total) * 100)
                : 0}
              %
            </p>
          </Card>

          {/* Notifications */}
          <Card>
            <h3>🔔 Notifications</h3>

            {notifications.length === 0 ? (
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: 13
                }}
              >
                No new notifications
              </div>
            ) : (
              notifications.slice(0, 5).map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,.08)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13
                        }}
                      >
                        {n.title}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: '#94a3b8',
                          marginTop: 3
                        }}
                      >
                        {n.message}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: '#64748b',
                          marginTop: 4
                        }}
                      >
                        {new Date(n.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={async () => {
                          try {
                            await notifAPI.markRead(n.id)

                            setNotifications(prev =>
                              prev.map(item =>
                                item.id === n.id
                                  ? { ...item, is_read: true }
                                  : item
                              )
                            )
                          } catch (err) {
                            console.error(err)
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        Mark Read
                      </button>
                    )}

                    {n.is_read && (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#10b981',
                          fontWeight: 600
                        }}
                      >
                        ✓ Read
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}

            {notifications.length > 5 && (
              <div
                style={{
                  marginTop: 10,
                  textAlign: 'center',
                  color: '#3b82f6',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                View All Notifications →
              </div>
            )}
                </Card>
          </div>
        )}

        {!isWorker && (
          <>
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
        <Card>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>
            🔔 Notifications
          </div>

          {notifications.length === 0 ? (
            <div style={{ color:'#94a3b8' }}>
              No notifications
            </div>
          ) : (
            notifications.slice(0,5).map(n => (
              <div
                key={n.id}
                style={{
                  padding:'10px 0',
                  borderBottom:'1px solid rgba(255,255,255,.08)'
                }}
              >
                <div style={{ fontWeight:600 }}>
                  {n.title}
                </div>

                <div
                  style={{
                    fontSize:12,
                    color:'#94a3b8',
                    marginTop:3
                  }}
                >
                  {n.message}
                </div>

                <div
                  style={{
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center',
                    marginTop:6
                  }}
                >
                  <div
                    style={{
                      fontSize:11,
                      color:'#64748b'
                    }}
                  >
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </div>

                  {!n.is_read ? (
                    <button
                      onClick={async () => {
                        try {
                          await notifAPI.markRead(n.id)

                          setNotifications(prev =>
                            prev.map(item =>
                              item.id === n.id
                                ? { ...item, is_read: true }
                                : item
                            )
                          )
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                      style={{
                        background:'transparent',
                        border:'none',
                        color:'#3b82f6',
                        cursor:'pointer',
                        fontSize:12,
                        fontWeight:600
                      }}
                    >
                      Mark Read
                    </button>
                  ) : (
                    <span
                      style={{
                        color:'#10b981',
                        fontSize:11,
                        fontWeight:600
                      }}
                    >
                      ✓ Read
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
        </div>
        
        {/* Priority breakdown */}
        <Card
          style={{
            marginTop:16
          }}
        >
            <div
              style={{
                fontSize:14,
                fontWeight:700,
                marginBottom:16
              }}
            >
              🏆 Worker Leaderboard
            </div>
         

          <table
            style={{
              width:'100%',
              borderCollapse:'collapse',
              fontSize:12
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom:'1px solid rgba(255,255,255,.1)'
                }}
              >
                <th align="left">Worker</th>
                <th align="center">Assigned</th>
                <th align="center">Resolved</th>
                <th align="center">Active</th>
                <th>⭐ Rating</th>
              </tr>
            </thead>

            <tbody>
              {[...workers]
                .sort((a,b) => b.avg_rating - a.avg_rating)
                .map((w,index) => (
                  <tr
                    key={w.id}
                    style={{
                      borderBottom:'1px solid rgba(255,255,255,.05)'
                    }}
                  >
                    <td
                      style={{
                        padding:'10px 0',
                        fontWeight:600
                      }}
                    >
                      {index === 0 && '🥇 '}
                      {index === 1 && '🥈 '}
                      {index === 2 && '🥉 '}
                      {w.name}
                    </td>

                    <td align="center">
                      {w.assigned_count}
                    </td>

                    <td align="center">
                      {w.resolved_count}
                    </td>

                    <td align="center">
                      {(w.assigned_count || 0) - (w.resolved_count || 0)}
                    </td>

                    <td
                      align="center"
                      style={{
                        color:'#fbbf24',
                        fontWeight:700
                      }}
                    >
                      {Number(w.avg_rating || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      
      </>
    )}
    </Layout>
  )
}
