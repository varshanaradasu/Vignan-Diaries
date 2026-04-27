import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { setToken } from '../lib/auth'
import '../styles/Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await api.post('/auth/login', { email, password })
      setToken(r.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🔑</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue to your account</p>
        </div>
        
        <form onSubmit={submit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email"
              className="form-input"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password"
              className="form-input"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer" style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
          <span><Link to="/forgot" className="auth-link">Forgot password?</Link></span>
          <span>Don't have an account? <Link to="/register" className="auth-link">Sign up</Link></span>
        </div>
      </div>
    </div>
  )
}
