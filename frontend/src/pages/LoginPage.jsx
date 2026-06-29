import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/common/UI'
import toast from 'react-hot-toast'
import "../styles/login.css";
import logo from "../assets/intellifix-logo.png";
import banner from "../assets/login-banner.png";
import { FiEye, FiEyeOff } from "react-icons/fi";
export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setF] = useState({ email: '', password: '' })
  const [errors, setE] = useState({})
  const [loading, setL] = useState(false)
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-page">

        {/* LEFT PANEL */}
        <div className="login-left"></div>
        {/* RIGHT PANEL */}

        <div className="login-right">

            <div className="login-card">

                <h2>

                    Welcome Back

                </h2>

                <p>

                    Sign in to continue to IntelliFix

                </p>

                {errors.general && (

                    <div className="login-error">

                        {errors.general}

                    </div>

                )}

                <form onSubmit={handleSubmit}>

                    <Input

                        label="Email Address"

                        type="email"

                        placeholder="you@example.com"

                        value={form.email}

                        onChange={e=>setF({...form,email:e.target.value})}

                        error={errors.email}

                    />

                    <div className="password-group">

                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => setF(f => ({...f,password:e.target.value}))}
                        error={errors.password}
                    />

                    <span
                        className="password-eye"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>

                </div>

                    <div className="login-options">

                        <label className="remember">
                            <input type="checkbox" />
                            <span>Keep me signed in</span>
                        </label>

                        <a href="#">

                            Forgot Password?

                        </a>

                    </div>

                    <Button

                        type="submit"

                        loading={loading}

                        style={{

                            width:"100%",

                            justifyContent:"center",

                            height:56,

                            fontSize:17,

                            marginTop:10

                        }}

                    >

                        Login

                    </Button>

                </form>

                <div className="login-register">

                    Don't have an account?

                    <Link to="/register">

                        Sign up

                    </Link>

                </div>

            </div>

        </div>

    </div>
    )
}
