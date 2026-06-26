import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { deptAPI, chatbotAPI, complaintAPI } from '../../services/api'
import { Layout, Card, Button, Input, Select, Textarea, Modal, Spinner } from '../../components/common/UI'
import toast from 'react-hot-toast'

const T = { pri:'#3b82f6', ok:'#10b981', warn:'#f59e0b', err:'#ef4444',
             tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b', brd:'#2a3a5c',
             bg3:'#141d35', surf:'#1a2540', acc2:'#8b5cf6' }

/* ── Camera Capture Component ──────────────────────────────────────────────── */
function CameraCapture({ onCapture, onClose, username }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)

  const [phase,       setPhase]      = useState('loading')
  const [previewUrl,  setPreview]    = useState(null)
  const [capturedBlob, setBlob]      = useState(null)
  const [capturedTs,  setTs]         = useState(null)
  const [gps,         setGps]        = useState({ lat:null, lng:null, acc:null, err:null })
  const [gpsLoading,  setGpsLoading] = useState(false)
  const [camErr,      setCamErr]     = useState('')
  const [facing,      setFacing]     = useState('environment')
  const [capturing,   setCapturing]  = useState(false)

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }, [])

  const startCam = useCallback(async (f = 'environment') => {
    stopStream(); setPhase('loading'); setCamErr('')
    if (!navigator.mediaDevices?.getUserMedia) { setCamErr('Camera API unavailable. Use HTTPS.'); setPhase('error'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: f }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      })
      streamRef.current = stream
      setFacing(f)
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}) }
      setPhase('live')
    } catch (err) {
      const msgs = { NotAllowedError:'Camera permission denied.', NotFoundError:'No camera found.', NotReadableError:'Camera in use by another app.' }
      setCamErr(msgs[err.name] || `Camera error: ${err.message}`)
      setPhase('error')
    }
  }, [stopStream])

  const fetchGPS = useCallback(() => new Promise(resolve => {
    if (!navigator.geolocation) return resolve({ lat:null, lng:null, acc:null, err:'Geolocation not supported.' })
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: parseFloat(p.coords.latitude.toFixed(6)), lng: parseFloat(p.coords.longitude.toFixed(6)), acc: Math.round(p.coords.accuracy), err: null }),
      e => resolve({ lat:null, lng:null, acc:null, err: ['','Location denied.','Unavailable.','Timed out.'][e.code] || 'GPS error.' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }), [])

  const buildFilename = useCallback((iso) => {
    const d = new Date(iso), p = n => String(n).padStart(2,'0')
    const date = `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`
    const time = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    const safe = (username||'user').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20) || 'user'
    return `${safe}_${date}_${time}.jpg`
  }, [username])

  const capture = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas || capturing) return
    if (video.readyState < 2 || video.videoWidth === 0) return
    setCapturing(true)
    const ts = new Date().toISOString(); setTs(ts)
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    if (facing === 'user') ctx.setTransform(1, 0, 0, 1, 0, 0)
    const label = `IntelliFix · ${new Date(ts).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'medium' })}`
    const fs = Math.max(14, Math.floor(canvas.width / 52))
    ctx.font = `bold ${fs}px monospace`
    const tw = ctx.measureText(label).width
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, canvas.height - fs*2.2, tw+20, fs*2.2)
    ctx.fillStyle = '#fff'; ctx.fillText(label, 10, canvas.height - fs*.4)
    canvas.toBlob(blob => {
      if (!blob) { setCapturing(false); return }
      setPreview(URL.createObjectURL(blob)); setBlob(blob)
      stopStream(); setPhase('preview'); setCapturing(false)
      setGpsLoading(true); fetchGPS().then(g => { setGps(g); setGpsLoading(false) })
    }, 'image/jpeg', 0.90)
  }, [capturing, facing, fetchGPS, stopStream])

  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreview(null); setBlob(null); setGps({ lat:null, lng:null, acc:null, err:null }); setTs(null)
    startCam(facing)
  }, [previewUrl, facing, startCam])

  const confirm = useCallback(() => {
    if (!capturedBlob) return
    onCapture({ blob: capturedBlob, filename: buildFilename(capturedTs), previewUrl, latitude: gps.lat, longitude: gps.lng, timestamp: capturedTs })
    onClose()
  }, [capturedBlob, capturedTs, gps, previewUrl, buildFilename, onCapture, onClose])

  useEffect(() => { startCam('environment'); return () => { stopStream(); if (previewUrl) URL.revokeObjectURL(previewUrl) } }, []) // eslint-disable-line

  const S = { vp:{ position:'relative', background:'#000', aspectRatio:'4/3', overflow:'hidden' }, st:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'#94a3b8', padding:20 } }
  const cornerStyle = (pos) => {
    const s = { position:'absolute', width:22, height:22, borderColor:'#3b82f6', borderStyle:'solid', opacity:.85 }
    if (pos==='tl') return {...s, top:14, left:14,  borderWidth:'2px 0 0 2px', borderRadius:'4px 0 0 0'}
    if (pos==='tr') return {...s, top:14, right:14, borderWidth:'2px 2px 0 0', borderRadius:'0 4px 0 0'}
    if (pos==='bl') return {...s, bottom:14, left:14,  borderWidth:'0 0 2px 2px', borderRadius:'0 0 0 4px'}
    if (pos==='br') return {...s, bottom:14, right:14, borderWidth:'0 2px 2px 0', borderRadius:'0 0 4px 0'}
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.93)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16 }}>
      <div style={{ background:'#0f1626', border:'1px solid #2a3a5c', borderRadius:16, width:'100%', maxWidth:480, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid #2a3a5c' }}>
          <div style={{ fontSize:15, fontWeight:700 }}>📷 Live Photo Capture</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
        <div style={S.vp}>
          {/* Always-mounted video — KEY FIX for capture working */}
          <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transform: facing==='user'?'scaleX(-1)':'none', visibility: phase==='live'?'visible':'hidden', position: phase==='live'?'relative':'absolute' }} />
          <canvas ref={canvasRef} style={{ display:'none' }} />
          {phase==='preview' && previewUrl && <img src={previewUrl} alt="Captured" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />}
          {phase==='loading' && <div style={S.st}><div style={{ width:36,height:36,border:'3px solid #2a3a5c',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin .7s linear infinite' }}/><div style={{ fontSize:13 }}>Starting camera…</div></div>}
          {phase==='error' && <div style={S.st}><div style={{ fontSize:36 }}>📵</div><div style={{ fontSize:13, color:'#ef4444', textAlign:'center' }}>{camErr}</div><button onClick={() => startCam(facing)} style={{ marginTop:10, padding:'8px 18px', background:'#3b82f6', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontWeight:600 }}>🔄 Try Again</button></div>}
          {phase==='live' && <>
            {['tl','tr','bl','br'].map(p => <div key={p} style={cornerStyle(p)} />)}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,.5)' }} />
            <button onClick={() => { stopStream(); startCam(facing==='environment'?'user':'environment') }} style={{ position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,.55)', border:'1px solid rgba(255,255,255,.2)', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>🔄</button>
          </>}
          {phase==='preview' && <div style={{ position:'absolute', top:10, left:10, background:'rgba(16,185,129,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'4px 9px', borderRadius:6 }}>✅ CAPTURED</div>}
        </div>
        {phase !== 'error' && (
          <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
            {phase==='live' && <button onClick={capture} disabled={capturing} style={{ width:64, height:64, borderRadius:'50%', background: capturing?'#ef4444':'#fff', border:`4px solid ${capturing?'#ef4444':'#3b82f6'}`, cursor: capturing?'not-allowed':'pointer', outline:'none' }} />}
            {phase==='preview' && <>
              <button onClick={retake} style={{ padding:'9px 18px', borderRadius:9, background:'#1a2540', border:'1px solid #2a3a5c', color:'#94a3b8', cursor:'pointer', fontWeight:600, fontSize:13 }}>🔄 Retake</button>
              <button onClick={confirm} style={{ padding:'9px 22px', borderRadius:9, background:'#3b82f6', border:'none', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13, flex:1 }}>✅ Use This Photo</button>
            </>}
          </div>
        )}
        {phase==='preview' && (
          <div style={{ padding:'4px 18px 14px', display:'flex', flexDirection:'column', gap:5 }}>
            {capturedTs && <div style={{ fontSize:11, color:'#94a3b8', display:'flex', gap:7 }}><span>🕐</span><span><strong style={{ color:'#64748b' }}>Captured: </strong>{new Date(capturedTs).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'medium'})}</span></div>}
            {capturedTs && <div style={{ fontSize:10, color:'#e2e8f0', fontFamily:'monospace', display:'flex', gap:7 }}><span>📄</span><span>{buildFilename(capturedTs)}</span></div>}
            <div style={{ fontSize:11, color:'#94a3b8', display:'flex', gap:7, alignItems:'center' }}>
              <span>📍</span>
              {gpsLoading ? <span style={{ display:'flex', alignItems:'center', gap:5, color:'#64748b' }}><span style={{ width:10,height:10,border:'2px solid #2a3a5c',borderTopColor:'#3b82f6',borderRadius:'50%',display:'inline-block',animation:'spin .6s linear infinite' }}/>Fetching GPS…</span>
              : gps.lat ? <span><strong style={{ color:'#64748b' }}>GPS: </strong>{Math.abs(gps.lat).toFixed(5)}°{gps.lat>=0?'N':'S'}, {Math.abs(gps.lng).toFixed(5)}°{gps.lng>=0?'E':'W'}{gps.acc && <span style={{ color:'#64748b',marginLeft:5 }}>±{gps.acc}m</span>}</span>
              : <span style={{ color:'#f59e0b' }}>⚠ {gps.err || 'GPS unavailable'}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Submit Complaint Page ─────────────────────────────────────────────── */
export default function SubmitComplaint() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [depts,    setDepts]   = useState([])
  const [form, setForm] = useState({
    title:'',
    description:'',
    location:'',
    address:'',
    latitude:null,
    longitude:null,
    department:'',
    is_anonymous:false
  })
  const [photo,    setPhoto]   = useState(null)
  const [chatbot,  setChatbot] = useState({ open:false, loading:false, suggestions:[] })
  const [showCam,  setShowCam] = useState(false)
  const [loading,  setLoading] = useState(false)
  const [errors,   setErrors]  = useState({})

  useEffect(() => { deptAPI.getAll().then(r => setDepts(r.data.results || r.data)).catch(() => {}) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const useCurrentLocation = () => {

    if (!navigator.geolocation) {
        toast.error("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        async ({ coords }) => {
          

            set("latitude", coords.latitude);
            set("longitude", coords.longitude);

            try {

                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
                );

                const data = await res.json();

                // Save only the full address
                set("address", data.display_name);

                // If the location box is empty, fill it with the full address.
                // Otherwise, leave the user's text unchanged.
                if (!form.location.trim()) {
                    set("location", data.display_name);
                }

            } catch {

                set(
                    "location",
                    "Current Location"
                );

            }

            toast.success("Location detected");

        },

        () => toast.error("Unable to fetch location"),

        {
                  
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
      
        }

    );

};

  const openChatbot = async () => {
    if (form.description.length < 10) { toast.error('Enter at least 10 characters description first.'); return }
    setChatbot(c => ({ ...c, open:true, loading:true, suggestions:[] }))
    try {
      const { data } = await chatbotAPI.suggestDept({ description: form.description })
      setChatbot(c => ({ ...c, loading:false, suggestions: data.suggestions || [] }))
    } catch {
      setChatbot(c => ({ ...c, loading:false }))
      toast.error('Chatbot unavailable. Please select department manually.')
    }
  }

  const selectSuggestion = (s) => {
    if (s.department_id) set('department', String(s.department_id))
    setChatbot(c => ({ ...c, open:false }))
    toast.success(`Department set to: ${s.department}`)
  }

  const validate = () => {
    const e = {}
    if (!form.title)       e.title       = 'Title is required'
    if (!form.description) e.description = 'Description is required'
    if (!form.location)    e.location    = 'Location is required'
    if (!form.department)  e.department  = 'Please select a department'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v) })
      if (photo?.blob) fd.append('image', photo.blob, photo.filename || 'photo.jpg')
      if (photo?.latitude) {
          fd.append("latitude", photo.latitude)
          fd.append("longitude", photo.longitude)
      }
      await complaintAPI.create(fd)
      toast.success('Complaint submitted successfully!')
      navigate('/user/complaints')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setErrors(data)
      else toast.error('Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const PRI_COLORS = { low:'#10b981', medium:'#f59e0b', high:'#ef4444', critical:'#dc2626' }

  return (
    <Layout title="Submit Complaint">
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <Card>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>📝 New Complaint</div>
          <div style={{ fontSize:12, color:T.tx3, marginBottom:24 }}>Provide details about your issue. Our AI will classify it and predict priority automatically.</div>

          <form onSubmit={handleSubmit}>
            <Input label="Complaint Title *" placeholder="Brief summary of the issue" value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} />

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, fontWeight:700, color:T.tx2, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>
                Description *
                <button type="button" onClick={openChatbot}
                  style={{ background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', color:'#fff', border:'none', borderRadius:6, padding:'3px 9px', fontSize:10, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  🤖 AI Suggest Department
                </button>
              </label>
              <Textarea placeholder="Describe the issue in detail — what, where, how severe…" value={form.description} onChange={e => set('description', e.target.value)} error={errors.description} style={{ minHeight:110 }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, fontWeight:700, color:T.tx2, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>
                  Department *
                </label>
                <select
                  value={form.department}
                  onChange={e => set('department', e.target.value)}
                  style={{ width:'100%', background:T.bg3, border:`1px solid ${errors.department ? T.err : T.brd}`, borderRadius:9, padding:'9px 12px', color:T.tx, fontSize:13, fontFamily:'inherit', outline:'none', appearance:'none', cursor:'pointer' }}
                >
                  <option value="">Select Department</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                </select>
                {errors.department && <div style={{ fontSize:11, color:T.err, marginTop:4 }}>{errors.department}</div>}
              </div>
              <div>
                <label
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.tx2,
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Location *

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    style={{
                      background: "linear-gradient(135deg,#10b981,#059669)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    📍 Current Location
                  </button>
                </label>

                <Input
                  placeholder="Area / Street / Landmark"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  error={errors.location}
                />
              </div>
            </div>

            <Textarea label="Full Address (optional)" placeholder="Full address for precise location" value={form.address} onChange={e => set('address', e.target.value)} style={{ minHeight:60 }} />

            

            {/* Photo section */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, fontWeight:700, color:T.tx2, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>
                Photo Evidence
                {photo && <span style={{ color:T.ok, fontWeight:700 }}>✅ CAPTURED</span>}
              </label>
              {!photo ? (
                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" onClick={() => setShowCam(true)}
                    style={{ flex:1, padding:14, borderRadius:10, border:`2px dashed ${T.brd}`, background:T.bg3, color:T.tx2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=T.pri; e.currentTarget.style.color=T.pri }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=T.brd; e.currentTarget.style.color=T.tx2 }}>
                    <span style={{ fontSize:22 }}>📷</span>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>Capture Live Photo</div>
                      <div style={{ fontSize:11, opacity:.7 }}>Auto-tags GPS coordinates + timestamp</div>
                    </div>
                  </button>
                  <label style={{ flex:1, padding:14, borderRadius:10, border:`2px dashed ${T.brd}`, background:T.bg3, color:T.tx2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=T.pri; e.currentTarget.style.color=T.pri }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=T.brd; e.currentTarget.style.color=T.tx2 }}>
                    <span style={{ fontSize:22 }}>🖼️</span>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>Upload Image</div>
                      <div style={{ fontSize:11, opacity:.7 }}>JPG, PNG up to 10MB</div>
                    </div>
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const url = URL.createObjectURL(file)
                        setPhoto({ blob: file, filename: file.name, previewUrl: url, latitude:null, longitude:null, timestamp: new Date().toISOString() })
                      }
                    }} />
                  </label>
                </div>
              ) : (
                <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${T.brd}` }}>
                  <div style={{ position:'relative' }}>
                    <img src={photo.previewUrl} alt="Evidence" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }} />
                    <div style={{ position:'absolute', top:8, left:8, background:'rgba(16,185,129,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>📷 ATTACHED</div>
                    <button type="button" onClick={() => { URL.revokeObjectURL(photo.previewUrl); setPhoto(null) }}
                      style={{ position:'absolute', top:8, right:8, width:28, height:28, borderRadius:'50%', background:'rgba(239,68,68,.85)', border:'none', color:'#fff', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                  <div style={{ padding:'8px 12px', fontSize:11, color:T.tx2, display:'flex', flexDirection:'column', gap:4 }}>
                    {photo.timestamp && <div>🕐 {new Date(photo.timestamp).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'medium'})}</div>}
                    {photo.filename && <div style={{ fontFamily:'monospace', fontSize:10, color:T.tx }}>{photo.filename}</div>}
                    {photo.latitude ? <div>📍 {Math.abs(photo.latitude).toFixed(5)}°{photo.latitude>=0?'N':'S'}, {Math.abs(photo.longitude).toFixed(5)}°{photo.longitude>=0?'E':'W'}</div> : <div>📍 GPS not available</div>}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <input type="checkbox" id="anon" checked={form.is_anonymous} onChange={e => set('is_anonymous', e.target.checked)} style={{ width:16, height:16, accentColor:T.pri }} />
              <label htmlFor="anon" style={{ fontSize:13, color:T.tx2, cursor:'pointer' }}>Submit anonymously (your name will be hidden from department)</label>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" loading={loading} style={{ flex:1, justifyContent:'center' }}>🚀 Submit Complaint</Button>
            </div>
          </form>
        </Card>
      </div>

      {/* AI Chatbot Modal */}
      <Modal open={chatbot.open} onClose={() => setChatbot(c=>({...c, open:false}))} title="🤖 AI Department Assistant" maxWidth={460}>
        <div style={{ background:T.bg3, borderRadius:9, padding:10, marginBottom:14, fontSize:11, color:T.tx2 }}>
          Using <strong>TF-IDF + Logistic Regression</strong> to classify your complaint into the right department.
        </div>
        {chatbot.loading ? <Spinner /> : chatbot.suggestions.length === 0 ? (
          <div style={{ textAlign:'center', padding:20, color:T.tx3 }}>No suggestions available</div>
        ) : chatbot.suggestions.map((s, i) => (
          <div key={i} onClick={() => selectSuggestion(s)}
            style={{ background:T.bg3, border:`1px solid ${i===0?T.pri:T.brd}`, borderRadius:10, padding:12, marginBottom:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .15s', ...(i===0?{background:'rgba(59,130,246,.08)'}:{}) }}
            onMouseEnter={e => e.currentTarget.style.borderColor=T.pri}
            onMouseLeave={e => e.currentTarget.style.borderColor=i===0?T.pri:T.brd}>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>{['🥇','🥈','🥉'][i]} {s.department}</div>
              <div style={{ height:3, background:T.brd, borderRadius:2, overflow:'hidden', marginTop:5, width:120 }}>
                <div style={{ height:'100%', background:T.pri, width:`${s.confidence}%` }} />
              </div>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:T.pri }}>{s.confidence}%</div>
          </div>
        ))}
      </Modal>

      {/* Camera Modal */}
      {showCam && <CameraCapture username={user?.name?.split(' ')[0]?.toLowerCase() || 'user'} onCapture={(p) => {setPhoto(p);if (p.latitude) {set("latitude", p.latitude);set("longitude", p.longitude);}}} />}
    </Layout>
  )
}
