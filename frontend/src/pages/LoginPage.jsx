import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/common/UI'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setF] = useState({ email: '', password: '' })
  const [errors, setE] = useState({})
  const [loading, setL] = useState(false)

  const T = { bg:'#0a0e1a', bg2:'#0f1626', brd:'#2a3a5c', surf:'#1a2540',
               pri:'#3b82f6', tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b' }

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setE(errs); return }
    setL(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      if (user.role === 'admin')      navigate('/admin')
      else if (user.role === 'department') navigate('/department')
      else navigate('/user')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password'
      toast.error(msg)
      setE({ general: msg })
    } finally {
      setL(false)
    }
  }

  const demoLogins = [
    { label: 'Admin',      email: 'admin@intellifix.com',  password: 'Admin@1234',    icon: '🛡️', role: 'admin' },
    { label: 'Official',   email: 'ramesh@intellifix.com', password: 'Official@1234', icon: '👷', role: 'department' },
    { label: 'Citizen',    email: 'ravi@example.com',      password: 'User@1234',     icon: '👤', role: 'citizen' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' }}>
      {/* Background gradient */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 40%, rgba(59,130,246,.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,.08) 0%, transparent 50%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 14px' }}>🔧</div>
          <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:-.5, color:T.tx }}>Intelli<span style={{ color:T.pri }}>Fix</span></h1>
          <p style={{ color:T.tx3, fontSize:13, marginTop:4 }}>Intelligent Complaint Management System</p>
        </div>

        {/* Card */}
        <div style={{ background:T.bg2, border:`1px solid ${T.brd}`, borderRadius:18, padding:32 }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>Sign In</h2>
          <p style={{ fontSize:12, color:T.tx3, marginBottom:24 }}>Enter your credentials to access the dashboard</p>

          {errors.general && (
            <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444', padding:'9px 13px', borderRadius:8, fontSize:12, marginBottom:14 }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input label="Email Address" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setF(f => ({...f, email:e.target.value}))}
              error={errors.email} />
            <Input label="Password" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setF(f => ({...f, password:e.target.value}))}
              error={errors.password} />
            <Button type="submit" loading={loading} style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              Sign In
            </Button>
          </form>

          <p style={{ textAlign:'center', fontSize:12, color:T.tx3, marginTop:20 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:T.pri, fontWeight:600 }}>Register here</Link>
          </p>

          {/* Demo accounts */}
          <div style={{ marginTop:24, paddingTop:20, borderTop:`1px solid ${T.brd}` }}>
            <div style={{ fontSize:10, color:T.tx3, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', marginBottom:10 }}>Quick Demo Access</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {demoLogins.map(d => (
                <button key={d.role}
                  onClick={() => { setF({ email:d.email, password:d.password }); }}
                  style={{ padding:'9px 13px', borderRadius:9, border:`1px solid ${T.brd}`, background:T.surf, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, transition:'all .15s', color:T.tx }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=T.pri}
                  onMouseLeave={e => e.currentTarget.style.borderColor=T.brd}
                >
                  <span style={{ fontSize:20 }}>{d.icon}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>Login as {d.label}</div>
                    <div style={{ fontSize:10, color:T.tx3 }}>{d.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
