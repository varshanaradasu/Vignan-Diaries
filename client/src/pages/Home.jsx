import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { API_URL, getUser } from '../lib/auth'
import '../styles/Home.css'
import BlurImg from '../widgets/BlurImg.jsx'

function resolveMediaUrl(url = '') {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const path = url.startsWith('/') ? url : `/${url}`
  return `${API_URL}${path}`
}

function LikeButton({ post, me, onUpdate }) {
  const initialLiked = !!(me && post.likes?.some?.(u => u === me.id || (u?._id === me?.id)))
  const [liked, setLiked] = useState(initialLiked)
  async function toggle() {
    if (!me) return alert('Login to like posts')
    const r = await api.post(`/posts/${post._id}/like`)
    setLiked(r.data.liked)
    onUpdate?.(r.data.likes, r.data.liked)
  }
  const [burst, setBurst] = useState(false)
  async function onClick() {
    await toggle();
    setBurst(true); setTimeout(()=>setBurst(false), 500);
  }
  return (
    <button onClick={onClick} className={`btn btn-small btn-secondary heart-btn ${burst ? 'heart-burst' : ''}`} style={{padding:'6px 10px'}}>
      <span className={`heart ${liked ? 'on' : ''}`}>❤</span>
      <span style={{ marginLeft: 6 }}>{liked ? 'Liked' : 'Like'}</span>
    </button>
  )
}

import SaveDialog from '../widgets/SaveDialog.jsx'
import { isSavedInAnyCollection } from '../lib/collections'

function SaveButton({ post }) {
  const postId = post._id
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(() => isSavedInAnyCollection(postId))
  function onClose(){ setOpen(false); setSaved(isSavedInAnyCollection(postId)) }
  return (
    <>
      <button onClick={()=>setOpen(true)} className={`btn btn-small btn-secondary ${saved ? 'is-saved' : ''}`} title={saved? 'Saved' : 'Save'}>
        {saved ? '🔖 Saved' : '🔖 Save'}
      </button>
      <SaveDialog open={open} postId={postId} postMeta={{
        _id: post._id, slug: post.slug, title: post.title, coverUrl: post.coverUrl, tags: post.tags,
        publishedAt: post.publishedAt || post.createdAt, author: { username: post.author?.username }
      }} onClose={onClose} />
    </>
  )
}

function ShareButton({ slug, title }) {
  async function share() {
    const url = `${window.location.origin}/post/${slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'Post', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Link copied!')
      }
    } catch {}
  }
  return (
    <button onClick={share} className="btn btn-small btn-secondary" title="Share">
      🔗 Share
    </button>
  )
}

function CommentsLinkButton({ slug }) {
  return (
    <Link to={`/post/${slug}#comments`} className="btn btn-small btn-secondary" title="Comments">
      💬 Comments
    </Link>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useSearchParams()
  const tag = params.get('tag') || ''
  const query = (params.get('query') || '').toLowerCase()
  const me = getUser()
  const [visible, setVisible] = useState(6)
  const [showAllTags, setShowAllTags] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/posts', { params: tag ? { tag } : {} }).then(r => {
      setPosts(r.data)
      setLoading(false)
    })
    api.get('/posts/tags').then(r => setTags(r.data))
  }, [tag])

  const filtered = posts.filter(p => {
    if (!query) return true
    const t = [p.title, p.author?.username, ...(p.tags||[])].join(' ').toLowerCase()
    return t.includes(query)
  })

  useEffect(() => { setVisible(6) }, [tag, query])
  // Collapse tags when the filter changes so UX resets
  useEffect(() => { setShowAllTags(false) }, [tags])

  // Infinite scroll sentinel
  const sentinelRef = useState(null)[0]
  useEffect(() => {
    const el = document.getElementById('feed-sentinel')
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => (v < filtered.length ? v + 6 : v))
      })
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [filtered.length])

  return (
    <div className="home-page">
      <div className="home-container">
      <div className="page-header">
        <h1 className="page-title">Discover Stories</h1>
        <p className="page-subtitle">Explore the latest posts from our community of writers</p>
      </div>

      <div className="filter-section">
        <div className="filter-header">Filter by Topic</div>
        <div className="tags-container">
          <button 
            onClick={() => setParams({})} 
            className={`tag-button ${!tag ? 'active' : ''}`}
          >
            All Posts
          </button>
          {(showAllTags ? tags : tags.slice(0, 15)).map(t => (
            <button 
              key={t} 
              onClick={() => setParams({ tag: t })} 
              className={`tag-button ${tag === t ? 'active' : ''}`}
            >
              {t}
            </button>
          ))}
          {tags.length > 15 && (
            <button
              onClick={() => setShowAllTags(v => !v)}
              className="btn btn-ghost btn-small"
              style={{ marginLeft: 6 }}
            >
              {showAllTags ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="posts-grid">
          {[1,2,3].map(i => (
            <article key={i} className="post-card">
              <div className="post-card-header">
                <div className="author-avatar skeleton" style={{width:48,height:48}} />
                <div style={{flex:1}}>
                  <div className="skeleton" style={{height:12, width:'40%', borderRadius:6, marginBottom:6}} />
                  <div className="skeleton" style={{height:10, width:'30%', borderRadius:6}} />
                </div>
              </div>
              <div className="skeleton" style={{height:180, borderRadius:12, margin:'8px 0'}} />
              <div className="skeleton" style={{height:16, width:'70%', borderRadius:8, marginBottom:8}} />
              <div className="skeleton" style={{height:12, width:'50%', borderRadius:8}} />
            </article>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-posts">
          <div className="empty-posts-icon">🔍</div>
          <h3>No results</h3>
          <p>Try a different search or tag.</p>
        </div>
      ) : (
        <div className="posts-grid">
          {filtered.slice(0, visible).map(p => (
            <article key={p._id} className="post-card">
              <div className="post-card-header">
                <div className="author-avatar">
                  {p.author?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="author-info">
                  <div className="author-name">{p.author?.username || 'Anonymous'}</div>
                  <div className="post-date">{new Date(p.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
              {(p.coverUrl || (p.images?.[0])) && (
                <div style={{ marginBottom: '1rem' }}>
                  {(() => {
                    const url = resolveMediaUrl(p.coverUrl || p.images?.[0] || '')
                    const u = (url || '').toLowerCase()
                    const isVideo = u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.avi') || u.includes('/video')
                    return isVideo 
                      ? (<video src={url} controls style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 300 }} />)
                      : (<BlurImg src={url} alt="cover" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 300 }} />)
                  })()}
                </div>
              )}
              <h3 className="post-card-title">
                <Link to={`/post/${p.slug}`}>{p.title}</Link>
              </h3>
              {p.tags?.length > 0 && (
                <div className="post-card-tags">
                  {p.tags.map(t => (
                    <span key={t} className="post-tag">#{t}</span>
                  ))}
                </div>
              )}
              <div className="post-card-footer">
                <div className="post-stat">
                  <span className="stat-icon">👁️</span>
                  <span>{p.views || 0} views</span>
                </div>
                <div className="post-stat">
                  <span className="stat-icon">❤️</span>
                  <span>{p.likes?.length || 0} likes</span>
                </div>
                <div style={{ marginLeft: 'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
                  <LikeButton post={p} me={me} onUpdate={(likes, liked)=>{
                    setPosts(prev => prev.map(x => x._id===p._id ? { ...x, likes: Array(likes).fill(0) } : x))
                  }} />
                  <CommentsLinkButton slug={p.slug} />
                  <SaveButton post={p} />
                  <ShareButton slug={p.slug} title={p.title} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <div id="feed-sentinel" style={{ height: 1 }} />
      </div>
    </div>
  )
}
