import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { complaintAPI } from '../../services/api'
import { Layout, Card, Badge, PriorityBadge, Button, Spinner, EmptyState, StarRating, Modal } from '../../components/common/UI'
import toast from 'react-hot-toast'

const T = { pri:'#3b82f6', ok:'#10b981', warn:'#f59e0b', err:'#ef4444', tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b', brd:'#2a3a5c', bg3:'#141d35', surf:'#1a2540' }

/* ── My Complaints List ────────────────────────────────────────────────────── */
export function MyComplaints() {
  const [complaints, setC] = useState([])
  const [loading,    setL] = useState(true)
  const [search,     setS] = useState('')
  const [statusF,    setSF] = useState('')
  const [priF,       setPF] = useState('')

  useEffect(() => {
    complaintAPI.getMine()
      .then(r => setC(r.data.results || r.data))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setL(false))
  }, [])

  const filtered = complaints.filter(c => {
    if (search  && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false
    if (statusF && c.status   !== statusF) return false
    if (priF    && c.priority !== priF)    return false
    return true
  })

  return (
    <Layout title="My Complaints" action={<Link to="/user/submit"><Button>+ New Complaint</Button></Link>}>
      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setS(e.target.value)} placeholder="🔍 Search..."
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', flex:1, minWidth:160 }} />
        <select value={statusF} onChange={e => setSF(e.target.value)}
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          <option value="">All Status</option>
          {['pending','in_progress','resolved','closed','rejected'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={priF} onChange={e => setPF(e.target.value)}
          style={{ background:T.bg3, border:`1px solid ${T.brd}`, borderRadius:9, padding:'8px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          <option value="">All Priority</option>
          {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="📋" title="No complaints found" subtitle="Submit your first complaint using the button above" />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(c => (
            <Link key={c.id} to={`/user/complaints/${c.id}`} style={{ textDecoration:'none', color:'inherit' }}>
              <Card style={{ display:'flex', gap:14, alignItems:'center', cursor:'pointer', transition:'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=T.pri}
                onMouseLeave={e => e.currentTarget.style.borderColor=T.brd}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize:12, color:T.tx2, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <Badge type={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <span style={{ fontSize:11, color:T.tx3 }}>📍 {c.location}</span>
                    <span style={{ fontSize:11, color:T.tx3 }}>🏢 {c.department_name}</span>
                    <span style={{ fontSize:11, color:T.tx3 }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {c.priority_score > 0 && <div style={{ fontSize:20, fontWeight:800, color:T.pri }}>{c.priority_score.toFixed(0)}</div>}
                  {c.priority_score > 0 && <div style={{ fontSize:9, color:T.tx3 }}>SCORE</div>}
                  {c.has_feedback && <div style={{ fontSize:10, color:T.ok, marginTop:4 }}>⭐ Rated</div>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}

export default MyComplaints

/* ── Complaint Detail (Citizen) ────────────────────────────────────────────── */
export function ComplaintDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [c,        setC]      = useState(null)
  const [loading,  setL]      = useState(true)
  const [fbModal,  setFbModal] = useState(false)
  const [fbForm,   setFbForm]  = useState({ rating:0, comment:'' })
  const [fbLoading, setFBL]   = useState(false)

  useEffect(() => {
    complaintAPI.get(id)
      .then(r => setC(r.data))
      .catch(() => { toast.error('Complaint not found'); navigate('/user/complaints') })
      .finally(() => setL(false))
  }, [id]) // eslint-disable-line

  const submitFeedback = async () => {
    if (!fbForm.rating) { toast.error('Please select a rating'); return }
    setFBL(true)
    try {
      await complaintAPI.addFeedback({ complaint: parseInt(id), ...fbForm })
      toast.success('Feedback submitted! Thank you.')
      setFbModal(false)
      const r = await complaintAPI.get(id)
      setC(r.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to submit feedback')
    } finally {
      setFBL(false)
    }
  }

  if (loading) return <Layout title="Complaint Detail"><Spinner /></Layout>
  if (!c)      return null

  const canFeedback = ['resolved','closed'].includes(c.status) && !c.has_feedback

  return (
    <Layout title={`Complaint #${c.id}`} action={<Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>}>
      <div style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Header */}
        <Card>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
            <h2 style={{ fontSize:18, fontWeight:800 }}>{c.title}</h2>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              <PriorityBadge priority={c.priority} />
              <Badge type={c.status} />
            </div>
          </div>
          <div style={{ fontSize:13, color:T.tx2, lineHeight:1.6, marginBottom:14 }}>{c.description}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:12 }}>
            {[['📍 Location', c.location], ['🏢 Department', c.department_name], ['📅 Submitted', new Date(c.created_at).toLocaleDateString('en-IN',{dateStyle:'long'})], ['⚡ Priority Score', `${c.priority_score?.toFixed(1) || 0}/100`]].map(([l,v]) => (
              <div key={l}><span style={{ color:T.tx3 }}>{l}</span><div style={{ fontWeight:600, marginTop:2 }}>{v}</div></div>
            ))}
          </div>
        </Card>

        {/* Photo evidence */}
        {c.image_url && (
          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>📷 Photo Evidence</div>
            <div style={{ position:'relative' }}>
              <img src={c.image_url} alt="Evidence" style={{ width:'100%', maxHeight:300, objectFit:'cover', borderRadius:9 }} />
            </div>
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4, fontSize:12, color:T.tx2 }}>
              {c.latitude  && <div>📍 GPS: {Math.abs(c.latitude).toFixed(5)}°{c.latitude>=0?'N':'S'}, {Math.abs(c.longitude).toFixed(5)}°{c.longitude>=0?'E':'W'} <a href={`https://maps.google.com?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color:T.pri, marginLeft:6, fontSize:11 }}>View on Maps ↗</a></div>}
              {c.photo_timestamp && <div>🕐 Captured: {new Date(c.photo_timestamp).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'medium'})}</div>}
            </div>
          </Card>
        )}

        {/* Status timeline */}
        {c.updates?.length > 0 && (
          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📋 Status Timeline</div>
            {c.updates.map((u, i) => (
              <div key={u.id} style={{ display:'flex', gap:12, paddingBottom:12, borderLeft:`2px solid ${T.brd}`, marginLeft:8, paddingLeft:16, position:'relative', ...(i===c.updates.length-1?{borderLeft:'none'}:{}) }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:T.pri, position:'absolute', left:-7, top:0 }} />
                <div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                    <Badge type={u.old_status} label={u.old_status.replace('_',' ')} />
                    <span style={{ color:T.tx3, fontSize:11 }}>→</span>
                    <Badge type={u.new_status} label={u.new_status.replace('_',' ')} />
                  </div>
                  {u.note && <div style={{ fontSize:12, color:T.tx2, marginTop:4 }}>{u.note}</div>}
                  <div style={{ fontSize:10, color:T.tx3, marginTop:4 }}>by {u.updated_by_name} · {new Date(u.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Existing feedback */}
        {c.feedback && (
          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>⭐ Your Rating</div>
            <StarRating value={c.feedback.rating} readOnly />
            {c.feedback.comment && <div style={{ fontSize:13, color:T.tx2, marginTop:10, fontStyle:'italic' }}>"{c.feedback.comment}"</div>}
          </Card>
        )}

        {/* Rate button */}
        {canFeedback && (
          <Button onClick={() => setFbModal(true)} style={{ width:'100%', justifyContent:'center' }}>⭐ Rate This Resolution</Button>
        )}
      </div>

      {/* Feedback Modal */}
      <Modal open={fbModal} onClose={() => setFbModal(false)} title="Rate This Resolution">
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, color:T.tx2, marginBottom:12 }}>How satisfied are you with the resolution of your complaint?</div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <StarRating value={fbForm.rating} onChange={r => setFbForm(f => ({...f, rating:r}))} size={36} />
          </div>
          <div style={{ textAlign:'center', fontSize:12, color:T.tx3, marginBottom:16 }}>
            {['','Poor','Below Average','Average','Good','Excellent'][fbForm.rating] || 'Click a star to rate'}
          </div>
          <Textarea label="Additional Comments (optional)" placeholder="Share your experience…" value={fbForm.comment} onChange={e => setFbForm(f => ({...f, comment:e.target.value}))} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="outline" onClick={() => setFbModal(false)}>Cancel</Button>
          <Button loading={fbLoading} onClick={submitFeedback} style={{ flex:1, justifyContent:'center' }}>Submit Feedback</Button>
        </div>
      </Modal>
    </Layout>
  )
}
