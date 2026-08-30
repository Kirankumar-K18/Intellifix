import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { complaintAPI, analyticsAPI, notifAPI } from '../../services/api'
import { Layout, StatCard, Card, Badge, PriorityBadge, Spinner, EmptyState } from '../../components/common/UI'
import { authAPI } from '../../services/api'
import { T } from "../../styles/theme";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  const statusData = [
    { name: "Pending", value: data?.pending || 0 },
    { name: "In Progress", value: data?.in_progress || 0 },
    { name: "Resolved", value: data?.resolved || 0 },
  ];

  const COLORS = [
    "#f59e0b",
    "#3b82f6",
    "#10b981",
  ];

  return (
    <Layout title={isWorker ? "Worker Dashboard" : "Department Dashboard"}>
      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.1))', border:`1px solid ${T.brd}`, borderRadius:14, padding:'18px 22px', marginBottom:22 }}>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:3 }}>Welcome, {user?.name}</div>
        <div style={{ fontSize:12, color:T.tx2 }}>{isWorker? "👷 Worker Portal": `🏢 ${user?.department_name}`} -IntelliFix</div>
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
            <h3>My Performance</h3>

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
          <Card
            style={{
              height: 420,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Notifications
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await notifAPI.markAllRead();

                      setNotifications((prev) =>
                        prev.map((n) => ({
                          ...n,
                          is_read: true,
                        }))
                      );
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Mark All Read
                </button>
              )}
            </div>

            {/* Scrollable Notifications */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    color: "#94a3b8",
                    textAlign: "center",
                    marginTop: 80,
                    fontSize: 13,
                  }}
                >
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(255,255,255,.08)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {n.title}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {n.message}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                        }}
                      >
                        {new Date(n.created_at).toLocaleString("en-IN")}
                      </span>

                      {!n.is_read ? (
                        <button
                          onClick={async () => {
                            try {
                              await notifAPI.markRead(n.id);

                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === n.id
                                    ? { ...item, is_read: true }
                                    : item
                                )
                              );
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#3b82f6",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Mark Read
                        </button>
                      ) : (
                        <span
                          style={{
                            color: "#10b981",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          ✓ Read
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
          </div>
        )}

        {!isWorker && (
          <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            alignItems: "stretch",
          }}
        >
        {/* Top priority complaints */}
        <Card
          style={{
            height: 420,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Complaints by Status
          </div>

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={95}
                dataKey="value"
                label={({ percent }) =>
                  percent > 0
                    ? `${(percent * 100).toFixed(0)}%`
                    : ""
                }
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 18,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            {statusData.map((item, index) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: COLORS[index],
                  }}
                />

                <span>
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card
          style={{
            height: 420,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Notifications
            </div>

            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    await notifAPI.markAllRead();

                    setNotifications((prev) =>
                      prev.map((n) => ({
                        ...n,
                        is_read: true,
                      }))
                    );
                  } catch (err) {
                    console.error(err);
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#3b82f6",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Mark All Read
              </button>
            )}
          </div>

          {/* Scrollable Notifications */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 6,
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  marginTop: 80,
                }}
              >
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {n.title}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      marginTop: 4,
                    }}
                  >
                    {n.message}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                      }}
                    >
                      {new Date(n.created_at).toLocaleString("en-IN")}
                    </span>

                    {!n.is_read ? (
                      <button
                        onClick={async () => {
                          try {
                            await notifAPI.markRead(n.id);

                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === n.id
                                  ? { ...item, is_read: true }
                                  : item
                              )
                            );
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#3b82f6",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Mark Read
                      </button>
                    ) : (
                      <span
                        style={{
                          color: "#10b981",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        ✓ Read
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
              Worker Leaderboard
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
