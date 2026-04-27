import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import '../styles/Home.css'

export default function Profile() {
  const { username } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/users/${username}`).then(r => r.data).catch(()=>null),
    ]).then(async ([u]) => {
      setUser(u)
      if (u?._id) {
        const list = await api.get('/posts', { params: { author: u._id } })
        setPosts(list.data || [])
      } else {
        // fallback by username via feed search
        const list = await api.get('/posts')
        setPosts((list.data || []).filter(p => p.author?.username === username))
      }
    }).finally(()=>setLoading(false))
  }, [username])

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="page-header">
          <h1 className="page-title">{user?.username || username}</h1>
          <p className="page-subtitle">{user?.bio || 'Author profile'}</p>
        </div>
        {loading ? (
          <div className="posts-grid">
            {[1,2,3].map(i => (
              <article key={i} className="post-card">
                <div className="skeleton" style={{height:180, borderRadius:12, margin:'8px 0'}} />
                <div className="skeleton" style={{height:16, width:'70%', borderRadius:8, marginBottom:8}} />
                <div className="skeleton" style={{height:12, width:'50%', borderRadius:8}} />
              </article>
            ))}
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(p => (
              <article key={p._id} className="post-card">
                {p.coverUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <img src={p.coverUrl} alt="cover" loading="lazy" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 260 }} />
                  </div>
                )}
                <h3 className="post-card-title"><Link to={`/post/${p.slug}`}>{p.title}</Link></h3>
                {p.tags?.length > 0 && (
                  <div className="post-card-tags">
                    {p.tags.map(t => (<span key={t} className="post-tag">#{t}</span>))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
