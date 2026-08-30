import { useState, useEffect } from 'react'
import { analyticsAPI } from '../../services/api'
import { Layout, Card, StatCard, Spinner } from '../../components/common/UI'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const T = {
  pri: '#3b82f6',
  ok: '#10b981',
  warn: '#f59e0b',
  err: '#ef4444',
  tx: '#e2e8f0',
  tx2: '#94a3b8',
  tx3: '#64748b',
  brd: '#2a3a5c',
  bg3: '#141d35',
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
]

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
}

const PRI_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export default function DeptAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setL] = useState(true)

  useEffect(() => {
    analyticsAPI
      .department()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setL(false))
  }, [])

  if (loading) {
    return (
      <Layout title="Analytics">
        <Spinner />
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout title="Analytics">
        <div
          style={{
            color: T.tx3,
            textAlign: 'center',
            padding: 40,
          }}
        >
          No data available
        </div>
      </Layout>
    )
  }

  const statusData = (data.by_status || []).map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.count,
  }))

  const priorityData = (data.by_priority || []).map((d) => ({
    name: PRI_LABELS[d.priority] || d.priority,
    value: d.count,
  }))

  const weeklyData = (data.weekly_trend || []).map((d) => ({
    week: d.week,
    Complaints: d.count,
  }))

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180
    const radius =
      innerRadius + (outerRadius - innerRadius) * 0.5

    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null
  }

  return (
    <Layout title="Department Analytics">

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Total"
          value={data.total ?? 0}
          color={T.pri}
        />

        <StatCard
          label="Resolved"
          value={data.resolved ?? 0}
          color={T.ok}
        />

        <StatCard
          label="Avg Rating"
          value={`${(data.avg_rating ?? 0).toFixed(1)}★`}
          color="#fbbf24"
        />

        <StatCard
          label="Avg Resolve"
          value={
            data.avg_resolution_hours
              ? `${data.avg_resolution_hours}h`
              : '—'
          }
          color={T.pri}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}
      >

        {/* By Status Pie */}
        <Card>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Complaints by Status
          </div>

          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                >
                  {statusData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background: '#1a2540',
                    border: '1px solid #2a3a5c',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: T.tx3,
                padding: 40,
              }}
            >
              No data
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            {statusData.map((d, i) => (
              <div
                key={d.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      COLORS[i % COLORS.length],
                  }}
                />

                <span style={{ color: T.tx2 }}>
                  {d.name}: {d.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* By Priority Pie */}
        <Card>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Complaints by Priority
          </div>

          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                >
                  {priorityData.map((d, i) => {
                    const c = {
                      low: '#10b981',
                      medium: '#f59e0b',
                      high: '#ef4444',
                      critical: '#dc2626',
                    }

                    return (
                      <Cell
                        key={i}
                        fill={
                          c[d.name.toLowerCase()] ||
                          COLORS[i]
                        }
                      />
                    )
                  })}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background: '#1a2540',
                    border: '1px solid #2a3a5c',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: T.tx3,
                padding: 40,
              }}
            >
              No data
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            {priorityData.map((d) => {
              const c = {
                Low: '#10b981',
                Medium: '#f59e0b',
                High: '#ef4444',
                Critical: '#dc2626',
              }

              return (
                <div
                  key={d.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        c[d.name] || T.pri,
                    }}
                  />

                  <span style={{ color: T.tx2 }}>
                    {d.name}: {d.value}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Weekly Trend */}
      {weeklyData.length > 0 && (
        <Card>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Weekly Trend (Last 8 Weeks)
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={weeklyData}
              margin={{
                top: 5,
                right: 20,
                bottom: 5,
                left: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2a3a5c"
              />

              <XAxis
                dataKey="week"
                tick={{
                  fill: T.tx3,
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fill: T.tx3,
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: '#1a2540',
                  border: '1px solid #2a3a5c',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="Complaints"
                stroke={T.pri}
                strokeWidth={2}
                dot={{
                  fill: T.pri,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

    </Layout>
  )
}