import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { complaintAPI, authAPI } from '../../services/api'
import { Layout, Card, Badge, PriorityBadge, Button, Spinner, EmptyState, Modal, StarRating } from '../../components/common/UI'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
const T = { pri:'#3b82f6', ok:'#10b981', warn:'#f59e0b', err:'#ef4444', tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b', brd:'#2a3a5c', bg3:'#141d35', surf:'#1a2540' }

/* ── Department Complaints List ─────────────────────────────────────────────── */
export default function DeptComplaints() {
  const [complaints, setC]  = useState([])
  const [loading,    setL]  = useState(true)
  const [search,     setS]  = useState('')
  const [statusF,    setSF] = useState('')
  const [priF,       setPF] = useState('')

  const load = useCallback(() => {
    setL(true)
    const params = new URLSearchParams({ ordering: '-priority_score,-created_at' })
    if (statusF) params.set('status', statusF)
    if (priF)    params.set('priority', priF)
    complaintAPI.getAll(params.toString())
      .then(r => setC(r.data.results || r.data))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setL(false))
  }, [statusF, priF])

  useEffect(() => { load() }, [load])

  const filtered = complaints.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="Complaints Queue" action={
      <div style={{ fontSize:11, color:T.tx3 }}>Sorted by AI priority score ↓</div>
    }>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setS(e.target.value)} placeholder="🔍 Search complaints..."
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', flex:1, minWidth:160 }} />
        <select value={statusF} onChange={e => setSF(e.target.value)}
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          <option value="">All Status</option>
          {['pending','in_progress','resolved','closed','rejected'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={priF} onChange={e => setPF(e.target.value)}
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          <option value="">All Priority</option>
          {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="✅" title="No complaints found" />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((c, idx) => (
            <Link key={c.id} to={`/department/complaints/${c.id}`} style={{ textDecoration:'none', color:'inherit' }}>
              <Card style={{ display:'flex', gap:14, alignItems:'center', cursor:'pointer', transition:'border-color .15s',
                borderLeft: c.priority === 'critical' ? '4px solid #dc2626' : c.priority === 'high' ? '4px solid #ef4444' : undefined }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.pri}
                onMouseLeave={e => e.currentTarget.style.borderColor = (c.priority==='critical'?'#dc2626':c.priority==='high'?'#ef4444':T.brd)}>
                {/* Rank badge */}
                <div style={{ width:32, height:32, borderRadius:8, background: T.bg3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0, color: T.tx3 }}>
                  #{idx + 1}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700 }}>{c.title}</span>
                    <PriorityBadge priority={c.priority} />
                    <Badge type={c.status} />

                    {c.is_escalated && (
                      <span
                        style={{
                          background:'#dc2626',
                          color:'white',
                          padding:'2px 8px',
                          borderRadius:'999px',
                          fontSize:'10px',
                          fontWeight:'700'
                        }}
                      >
                        🚨 Escalated
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:T.tx2, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</div>
                  <div style={{ display:'flex', gap:12, fontSize:11, color:T.tx3, flexWrap:'wrap' }}>
                    <span>📍 {c.address || c.location}</span>

                    <span>
                      👤 {c.is_anonymous ? 'Anonymous' : c.user_name}
                    </span>

                    <span>
                      👷 {c.assigned_to_name || 'Unassigned'}
                    </span>

                    <span>
                      📅 {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:22, fontWeight:800, color: T.pri }}>{c.priority_score?.toFixed(0)}</div>
                  <div style={{ fontSize:9, color:T.tx3 }}>PRIORITY SCORE</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}

/* ── Department Complaint Detail ───────────────────────────────────────────── */
export function DeptComplaintDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [c,         setC]  = useState(null)
  const [loading,   setL]  = useState(true)
  const [statusForm, setSF] = useState({ status:'', assigned_to:'', note:'' })
  const [updating,  setU]  = useState(false)
  const [showUpdate, setSU] = useState(false)
  const [workers, setWorkers] = useState([])
  const { user } = useAuth()

  const load = useCallback(() => {
  setL(true)

  Promise.all([
    complaintAPI.get(id),
    authAPI.getUsers('role=worker')
  ])
    .then(([cr, wr]) => {
      setC(cr.data)

      setSF({
        status: cr.data.status,
        assigned_to: cr.data.assigned_to || '',
        note: ''
      })

      setWorkers(wr.data.results || wr.data)
    })
    .catch(() => {
      toast.error('Complaint not found')
      navigate('/department/complaints')
    })
    .finally(() => setL(false))
}, [id, navigate])

  useEffect(() => { load() }, [load])

  const handleUpdate = async () => {
    if (!statusForm.status) { toast.error('Please select a status'); return }
    setU(true)
    try {
      await complaintAPI.update(id, statusForm)
      toast.success('Status updated successfully')
      setSU(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setU(false)
    }
  }

  if (loading) return <Layout title="Complaint Detail"><Spinner /></Layout>
  if (!c)      return null

  return (
    <Layout
      title={`Complaint #${c.id}`}
      action={
        <div style={{ display:'flex', gap:8 }}>
          <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
          <Button onClick={() => setSU(true)}>Update Status</Button>
        </div>
      }
    >
      <div style={{ maxWidth:800, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Header card */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <h2 style={{ fontSize:18, fontWeight:800 }}>{c.title}</h2>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <PriorityBadge priority={c.priority} />
              <Badge type={c.status} />

              {c.is_escalated && (
                <span
                  style={{
                    background:'#dc2626',
                    color:'white',
                    padding:'4px 10px',
                    borderRadius:'999px',
                    fontSize:'11px',
                    fontWeight:'700'
                  }}
                >
                  🚨 Escalated
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize:13, color:T.tx2, lineHeight:1.65, marginBottom:14 }}>{c.description}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, fontSize:12 }}>
            {[
                ['📍 Location', c.location],
                ['👤 Citizen', c.is_anonymous ? 'Anonymous' : c.user_name],
                ['📧 Email', c.is_anonymous ? '—' : c.user_email],

                ['👷 Worker', c.assigned_to_name || 'Unassigned'],
                ['📱 Worker Phone', c.assigned_to_phone || '—'],
                ['⚡ Priority Score', `${c.priority_score?.toFixed(1) || 0} / 100`],

                ['📅 Submitted', new Date(c.created_at).toLocaleDateString('en-IN', { dateStyle:'long' })],
                ['✅ Resolved', c.resolved_at ? new Date(c.resolved_at).toLocaleDateString('en-IN') : '—'],
              ].map(([l, v]) => (
              <div key={l}>
                <div style={{ color:T.tx3, marginBottom:2 }}>{l}</div>
                <div style={{ fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
        {c.latitude && c.longitude && (
              <Card>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>
                  📍 Location
                </div>

                <div style={{ marginBottom:12 }}>
                  {c.address || c.location}
                </div>

                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🧭 Navigate
                </a>
              </Card>
            )}
        
        {/* Photo */}
        {c.image_url && (
          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>
              📷 Photo Evidence
            </div>

            <img
              src={c.image_url}
              alt="Evidence"
              style={{
                width:'100%',
                maxHeight:300,
                objectFit:'cover',
                borderRadius:9
              }}
            />

            <div
              style={{
                marginTop:10,
                display:'flex',
                flexDirection:'column',
                gap:4,
                fontSize:12,
                color:T.tx2
              }}
            >
              {c.photo_timestamp && (
                <div>
                  🕐 {new Date(c.photo_timestamp).toLocaleString('en-IN',{
                    dateStyle:'medium',
                    timeStyle:'medium'
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Feedback */}
        {c.feedback && (
          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>⭐ Citizen Rating</div>
            <StarRating value={c.feedback.rating} readOnly />
            {c.feedback.comment && <div style={{ fontSize:13, color:T.tx2, marginTop:8, fontStyle:'italic' }}>"{c.feedback.comment}"</div>}
            <div style={{ fontSize:10, color:T.tx3, marginTop:6 }}>Submitted by {c.feedback.user_name} · {new Date(c.feedback.created_at).toLocaleDateString('en-IN')}</div>
          </Card>
        )}

        {/* Timeline */}
        {c.updates?.length > 0 && (
          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📋 Status Timeline</div>
            {c.updates.map((u, i) => (
              <div key={u.id} style={{ display:'flex', gap:12, paddingBottom:12, borderLeft:`2px solid ${T.brd}`, marginLeft:8, paddingLeft:16, position:'relative', ...(i===c.updates.length-1?{borderLeft:'2px solid transparent'}:{}) }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:T.pri, position:'absolute', left:-7, top:0 }} />
                <div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                    <Badge type={u.old_status} label={u.old_status.replace('_',' ')} />
                    <span style={{ color:T.tx3, fontSize:11 }}>→</span>
                    <Badge type={u.new_status} label={u.new_status.replace('_',' ')} />
                  </div>
                  {u.note && <div style={{ fontSize:12, color:T.tx2 }}>{u.note}</div>}
                  <div style={{ fontSize:10, color:T.tx3, marginTop:3 }}>by {u.updated_by_name} · {new Date(u.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Update Status Modal */}
      {(user?.role === 'department_admin' || user?.role === 'worker') && (
      <Modal
        open={showUpdate}
        onClose={() => setSU(false)}
        title="Update Complaint Status"
      >

        {/* Assign Worker */}
        {user?.role === 'department_admin' && (
          <div style={{ marginBottom:14 }}>
            <label>Assign Worker</label>

            <select
              value={statusForm.assigned_to}
              onChange={e =>
                setSF(f => ({
                  ...f,
                  assigned_to: e.target.value
                }))
              }
            >
              <option value="">Unassigned</option>

              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status */}
        <div style={{ marginBottom:14 }}>
          <label
            style={{
              display:'block',
              fontSize:11,
              fontWeight:700,
              color:T.tx2,
              marginBottom:5,
              textTransform:'uppercase',
              letterSpacing:.5
            }}
          >
            New Status
          </label>

          <select
            value={statusForm.status}
            onChange={e =>
              setSF(f => ({
                ...f,
                status:e.target.value
              }))
            }
            style={{
              width:'100%',
              background:T.bg3,
              border:`1px solid ${T.brd}`,
              borderRadius:9,
              padding:'9px 12px',
              color:T.tx,
              fontSize:13,
              fontFamily:'inherit',
              outline:'none',
              cursor:'pointer'
            }}
          >
            {['pending','in_progress','resolved','closed','rejected'].map(s => (
              <option key={s} value={s}>
                {s.replace('_',' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div style={{ marginBottom:14 }}>
          <label
            style={{
              display:'block',
              fontSize:11,
              fontWeight:700,
              color:T.tx2,
              marginBottom:5,
              textTransform:'uppercase',
              letterSpacing:.5
            }}
          >
            Internal Note (optional)
          </label>

          <textarea
            value={statusForm.note}
            onChange={e =>
              setSF(f => ({
                ...f,
                note:e.target.value
              }))
            }
            placeholder="Add notes about this status change..."
            style={{
              width:'100%',
              background:T.bg3,
              border:`1px solid ${T.brd}`,
              borderRadius:9,
              padding:'9px 12px',
              color:T.tx,
              fontSize:13,
              fontFamily:'inherit',
              outline:'none',
              resize:'vertical',
              minHeight:80
            }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <Button
            variant="outline"
            onClick={() => setSU(false)}
          >
            Cancel
          </Button>

          <Button
            loading={updating}
            onClick={handleUpdate}
            style={{ flex:1, justifyContent:'center' }}
          >
            Save Changes
          </Button>
        </div>

      </Modal>
      )}
    </Layout>
  )
}
