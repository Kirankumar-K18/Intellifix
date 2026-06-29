import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/common/UI'
import toast from 'react-hot-toast'
import "../styles/login.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate    = useNavigate()
  const [form, setF] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
  });
  const [errors, setE] = useState({})
  const [loading, setL] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const T = { bg:'#0a0e1a', bg2:'#0f1626', brd:'#2a3a5c', surf:'#1a2540',
               pri:'#3b82f6', tx:'#e2e8f0', tx2:'#94a3b8', tx3:'#64748b' }

  const validate = () => {
      const e = {};

      if (!form.name) e.name = "Full Name is required";

      if (!form.email) e.email = "Email is required";

      if (!form.phone) e.phone = "Phone Number is required";

      if (!form.password) e.password = "Password is required";
      if (form.password && form.password.length < 8) {
            e.password = "Password must be at least 8 characters";
        }

      if (!form.confirmPassword)
          e.confirmPassword = "Confirm your password";

      if (
          form.password &&
          form.confirmPassword &&
          form.password !== form.confirmPassword
      ) {
          e.confirmPassword = "Passwords do not match";
      }

      return e;
  };

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setE(errs); return }
    setL(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password2: form.confirmPassword,
    });

    toast.success("Account created successfully!");

    navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
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
                    Create Account
                </h2>
                <p className="login-subtitle">
                    Join IntelliFix and start reporting smarter.
                </p>

                {errors.general && (

                    <div className="login-error">

                        {errors.general}

                    </div>

                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Full Name"
                        type="text"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={(e) =>
                            setF((f) => ({
                                ...f,
                                name: e.target.value,
                            }))
                        }
                        error={errors.name}
                    />

                    <Input

                        label="Email Address"

                        type="email"

                        placeholder="you@example.com"

                        value={form.email}

                        onChange={e=>setF({...form,email:e.target.value})}

                        error={errors.email}

                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={form.phone}
                        onChange={(e) =>
                            setF((f) => ({
                                ...f,
                                phone: e.target.value,
                            }))
                        }
                        error={errors.phone}
                    />

                    <div className="password-group">

                      <Input
                          label="Password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={form.password}
                          onChange={(e) =>
                              setF((f) => ({
                                  ...f,
                                  password: e.target.value,
                              }))
                          }
                          error={errors.password}
                      />

                      <span
                          className="password-eye"
                          onClick={() => setShowPassword(!showPassword)}
                      >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                      </span>

                  </div>

                  <div className="password-group">

                      <Input
                          label="Confirm Password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={form.confirmPassword}
                          onChange={(e) =>
                              setF((f) => ({
                                  ...f,
                                  confirmPassword: e.target.value,
                              }))
                          }
                          error={errors.confirmPassword}
                      />

                      <span
                          className="password-eye"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </span>

                  </div>

                <Button
                    type="submit"
                    loading={loading}
                    style={{
                        width: "100%",
                        justifyContent: "center",
                        marginTop: 12,
                    }}
                >
                    Create Account
                </Button>

                <p className="login-register">
                    Already have an account?{" "}
                    <Link to="/login">Sign In</Link>
                </p>

                  

                </form>

                

            </div>

        </div>

    </div>
    )
}
