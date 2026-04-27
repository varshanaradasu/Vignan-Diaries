import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { setToken } from '../lib/auth'
import '../styles/Auth.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await api.post('/auth/register', { username, email, password, role })
      setToken(r.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🎉</div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the Vignan University community</p>
        </div>
        
        <form onSubmit={submit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              id="username"
              type="text"
              className="form-input"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="johndoe"
              required
              minLength={3}
            />
          </div>

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
              minLength={6}
            />
            <small style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>At least 6 characters</small>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">I am a</label>
            <select id="role" className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
