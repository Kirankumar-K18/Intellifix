import { useEffect, useState } from 'react'
import { Layout, Card } from '../../components/common/UI'
import { complaintAPI } from '../../services/api'

export default function Performance() {
  const [complaints, setComplaints] = useState([])
  const [feedbacks, setFeedbacks] = useState([])

  useEffect(() => {
    complaintAPI.getAll()
        .then(res => {
        const data = res.data.results || res.data
        console.log("Complaints:", data)
        setComplaints(data)
        })

    complaintAPI.getFeedback()
        .then(res => {
        const data = res.data.results || res.data
        console.log("Feedbacks:", data)
        setFeedbacks(data)
        })
    }, [])

  const assigned = complaints.length
  const pending = complaints.filter(c => c.status === 'pending').length
  const progress = complaints.filter(c => c.status === 'in_progress').length
  const resolved = complaints.filter(
    c => c.status === 'resolved' || c.status === 'closed'
  ).length

  const avgRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((s, f) => s + f.rating, 0) /
          feedbacks.length
        ).toFixed(1)
      : '0.0'

  return (
    <Layout title="My Performance">

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 16,
          marginBottom: 20
        }}
      >
        <Card>
          <h3>📋 Assigned</h3>
          <h1>{assigned}</h1>
        </Card>

        <Card>
          <h3>⏳ Pending</h3>
          <h1>{pending}</h1>
        </Card>

        <Card>
          <h3>🔄 In Progress</h3>
          <h1>{progress}</h1>
        </Card>

        <Card>
          <h3>✅ Resolved</h3>
          <h1>{resolved}</h1>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <h3>⭐ Performance Summary</h3>
        <p>Average Rating: {avgRating} ⭐</p>
        <p>Resolved Complaints: {resolved}</p>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3>💬 Recent Feedback</h3>

        {feedbacks.length === 0 ? (
          <p>No feedback received yet.</p>
        ) : (
          feedbacks.slice(0, 5).map(f => (
            <div
              key={f.id}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,.08)'
              }}
            >
              <div>{'⭐'.repeat(f.rating)}</div>
              <div>{f.comment || 'No comment provided'}</div>
              <small>{f.user_name}</small>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h3>📋 Assigned Complaints</h3>

        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {complaints.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.title}</td>
                <td>{c.priority}</td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

    </Layout>
  )
}
