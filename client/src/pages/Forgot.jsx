import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { setToken } from '../lib/auth'
import '../styles/Auth.css'

export default function Forgot() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function sendCode(e){
    e.preventDefault()
    setLoading(true); setMessage('')
    try{
      await api.post('/auth/forgot', { email })
      setStep(2)
      setMessage('We sent a 6-digit code to your email. It expires in 10 minutes.')
    } catch(err){
      setMessage(err.response?.data?.error || 'Failed to send code')
    } finally{ setLoading(false) }
  }

  async function reset(e){
    e.preventDefault()
    if (password !== confirm) { setMessage('Passwords do not match'); return }
    setLoading(true); setMessage('')
    try{
      const r = await api.post('/auth/reset', { email, otp, password })
      if (r.data?.token) {
        setToken(r.data.token)
        navigate('/dashboard')
        return
      }
      setMessage('Password updated. You can now login.')
      navigate('/login')
    } catch(err){
      setMessage(err.response?.data?.error || 'Invalid or expired OTP')
    } finally{ setLoading(false) }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">📧</div>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">We'll send a one-time code to your email</p>
        </div>

        {step === 1 ? (
          <form onSubmit={sendCode} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input id="email" type="email" className="form-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>{loading ? 'Sending...' : 'Send Code'}</button>
            <div className="auth-footer">Remembered your password? <Link to="/login" className="auth-link">Back to login</Link></div>
            {message && <div style={{marginTop:8,color:'var(--color-text-light)'}}>{message}</div>}
          </form>
        ) : (
          <form onSubmit={reset} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter 6-digit code</label>
              <input id="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className="form-input" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="123456" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">New Password</label>
              <input id="password" type="password" className="form-input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm">Confirm Password</label>
              <input id="confirm" type="password" className="form-input" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
            {message && <div style={{marginTop:8,color: message.includes('match')? 'var(--color-danger)' : 'var(--color-text-light)'}}>{message}</div>}
          </form>
        )}
      </div>
    </div>
  )
}
