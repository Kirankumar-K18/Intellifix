import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Button, Input } from '../components/common/UI'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setF] = useState({ name:'', email:'', phone:'', password:'', password2:'' })
  const [errors, setE] = useState({})
  const [loading, setL] = useState(false)

  const T = { bg:'#0a0e1a', bg2:'#0f1626', brd:'#2a3a5c', surf:'#1a2540',
               pri:'#3b82f6', tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b', err:'#ef4444' }

  const validate = () => {
    const e = {}
    if (!form.name)     e.name     = 'Full name is required'
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    if (form.password !== form.password2) e.password2 = 'Passwords do not match'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setE(errs); return }
    setL(true)
    try {
      await authAPI.register(form)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setE(data)
      else toast.error('Registration failed. Please try again.')
    } finally {
      setL(false)
    }
  }

  const field = (k, label, type='text', placeholder='') => (
    <Input label={label} type={type} placeholder={placeholder}
      value={form[k]} onChange={e => setF(f => ({...f, [k]:e.target.value}))}
      error={errors[k]} />
  )

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:13, background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 12px' }}>🔧</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.tx }}>Create Account</h1>
          <p style={{ color:T.tx3, fontSize:13, marginTop:4 }}>Join IntelliFix to report and track complaints</p>
        </div>

        <div style={{ background:T.bg2, border:`1px solid ${T.brd}`, borderRadius:18, padding:32 }}>
          {errors.general && (
            <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:T.err, padding:'9px 13px', borderRadius:8, fontSize:12, marginBottom:14 }}>
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {field('name',      'Full Name',        'text',     'John Doe')}
            {field('email',     'Email Address',    'email',    'john@example.com')}
            {field('phone',     'Phone Number',     'tel',      '+91 98765 43210')}
            {field('password',  'Password',         'password', 'Min 6 characters')}
            {field('password2', 'Confirm Password', 'password', 'Re-enter password')}
            <Button type="submit" loading={loading} style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              Create Account
            </Button>
          </form>
          <p style={{ textAlign:'center', fontSize:12, color:T.tx3, marginTop:20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:T.pri, fontWeight:600 }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
