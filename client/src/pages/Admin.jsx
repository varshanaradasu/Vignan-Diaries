import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { getToken } from '../lib/auth'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const t = getToken()
    if (!t) return navigate('/login')
    try {
      const payload = JSON.parse(atob(t.split('.')[1]))
      if (payload.role !== 'admin') return navigate('/')
    } catch { return navigate('/') }
    ;(async () => {
      const [s, u, p] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/posts'),
      ])
      setStats(s.data)
      setUsers(u.data)
      setPosts(p.data)
    })()
  }, [navigate])

  if (!stats) return <div className="container">Loading admin dashboard…</div>

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
        <div className="stat-card"><b>Total Users</b><div style={{ fontSize: 28 }}>{stats.users}</div></div>
        <div className="stat-card"><b>Total Posts</b><div style={{ fontSize: 28 }}>{stats.posts}</div></div>
        <div className="stat-card"><b>Total Comments</b><div style={{ fontSize: 28 }}>{stats.comments}</div></div>
        <div className="stat-card"><b>Total Likes</b><div style={{ fontSize: 28 }}>{stats.likes}</div></div>
        <div className="stat-card"><b>Total Views</b><div style={{ fontSize: 28 }}>{stats.views}</div></div>
      </div>

      <h2 style={{ marginTop: 24 }}>Recent Posts</h2>
      <div style={{ background: 'white', borderRadius: 12, padding: 12 }}>
        {stats.recentPosts.map(p => (
          <div key={p._id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 600 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{p.author?.username} · {new Date(p.createdAt).toLocaleString()} · {p.status}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 24 }}>Users</h2>
      <div style={{ background: 'white', borderRadius: 12, padding: 12 }}>
        {users.map(u => (
          <div key={u._id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            {u.username} <span style={{ color: '#666' }}>({u.email})</span> — <b>{u.role}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
