import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { getToken, clearToken } from '../lib/auth'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [drafts, setDrafts] = useState([])
  const [filter, setFilter] = useState('All Posts')
  const [stats, setStats] = useState({ total: 0, views: 0, likes: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser(payload)
      loadPosts(payload.id)
    } catch (e) {
      navigate('/login')
    }
  }, [navigate])

  async function loadPosts(userId) {
    try {
      const [publishedRes, draftsRes] = await Promise.all([
        api.get('/posts', { params: { author: userId } }), // published only (server feed)
        api.get('/posts/drafts') // author inferred from token
      ])
      setPosts(publishedRes.data)
      setDrafts(draftsRes.data)
      // Calculate stats from published only
      const totalViews = publishedRes.data.reduce((sum, p) => sum + (p.views || 0), 0)
      const totalLikes = publishedRes.data.reduce((sum, p) => sum + (p.likes?.length || 0), 0)
      setStats({ total: publishedRes.data.length, views: totalViews, likes: totalLikes })
    } catch (e) {
      console.error('Failed to load posts', e)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    clearToken()
    navigate('/')
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/posts/${id}`)
      setPosts(prev => prev.filter(p => p._id !== id))
      setDrafts(prev => prev.filter(p => p._id !== id))
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to delete post'
      alert(msg)
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, <span className="gradient-text">{user?.username}</span>!</h1>
          <p className="subtitle">Manage your posts and track your growth</p>
        </div>
        <div className="header-actions">
          <Link to="/editor" className="btn btn-primary">
            <span className="btn-icon">✍️</span> New Post
          </Link>
          <button onClick={handleLogout} className="btn btn-ghost">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Posts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.views}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.likes}</div>
            <div className="stat-label">Total Likes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total > 0 ? Math.round(stats.views / stats.total) : 0}</div>
            <div className="stat-label">Avg Views/Post</div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="posts-section">
        <div className="section-header">
          <h2>Your Posts</h2>
          <div className="section-actions">
            <select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option>All Posts</option>
              <option>Published</option>
              <option>Drafts</option>
            </select>
          </div>
        </div>

{((filter === 'Drafts'
  ? drafts
  : (filter === 'Published'
      ? posts
      : [...drafts.map(d => ({ ...d, isDraft: true })), ...posts])
)).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No {filter.toLowerCase()}</h3>
            <p>{filter==='Drafts' ? 'Your saved drafts will appear here.' : 'Start writing your first blog post!'}</p>
            <Link to="/editor" className="btn btn-primary">
              Create Post
            </Link>
          </div>
        ) : (
          <div className="posts-list">
            {(filter === 'Drafts' ? drafts : (filter === 'Published' ? posts : [...drafts.map(d=>({...d,isDraft:true})), ...posts]) ).map(post => (
              <div key={post._id} className="post-item">
                <div className="post-status">
                  <span className={`status-badge ${post.status || (post.isDraft?'draft':'')}`}>
                    {(post.status === 'published' && !post.isDraft) ? '✓ Published' : '📝 Draft'}
                  </span>
                </div>
                <div className="post-content">
                  <h3 className="post-title">
                    {(post.status === 'published' && !post.isDraft) ? (
                      <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    ) : (
                      post.title || '(Untitled)'
                    )}
                  </h3>
                  <div className="post-meta">
                    <span>👁️ {post.views || 0} views</span>
                    <span>❤️ {post.likes?.length || 0} likes</span>
                    <span>🗓️ {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {post.tags?.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="post-actions">
                  <Link to={`/editor?id=${post._id}`} className="btn btn-small btn-ghost">
                    Edit
                  </Link>
                  <button onClick={() => deletePost(post._id)} className="btn btn-small btn-ghost btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
