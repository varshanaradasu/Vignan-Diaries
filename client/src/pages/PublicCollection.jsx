import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import '../styles/Home.css'

export default function PublicCollection() {
  const { username, name } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/collections/public/${username}/${name}`).then(r => setPosts(r.data.posts || [])).finally(()=>setLoading(false))
  }, [username, name])

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="page-header">
          <h1 className="page-title">{name} · by {username}</h1>
          <p className="page-subtitle">Shared collection</p>
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
        ) : posts.length === 0 ? (
          <div className="empty-posts">
            <div className="empty-posts-icon">📭</div>
            <h3>No posts in this collection</h3>
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
