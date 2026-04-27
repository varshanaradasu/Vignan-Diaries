import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { io } from 'socket.io-client'
import { api } from '../api'
import { API_URL, getUser } from '../lib/auth'
import CommentList from '../widgets/CommentList.jsx'
import CommentForm from '../widgets/CommentForm.jsx'
import SaveDialog from '../widgets/SaveDialog.jsx'
import { isSavedInAnyCollection } from '../lib/collections'
import '../styles/Post.css'
import BlurImg from '../widgets/BlurImg.jsx'

function resolveMediaUrl(url = '') {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const path = url.startsWith('/') ? url : `/${url}`
  return `${API_URL}${path}`
}

export default function Post() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const me = getUser()

  // Open comments if navigated with #comments
  useEffect(() => {
    if (window.location.hash === '#comments') {
      setShowComments(true)
      setTimeout(() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [post?._id])

  useEffect(() => {
    let s
    api.get(`/posts/slug/${slug}`).then(async (r) => {
      setPost(r.data)
      const list = await api.get(`/comments/${r.data._id}`)
      setComments(list.data)
      s = io(API_URL, { transports: ['websocket'] })
      s.emit('join_post', r.data._id)
      s.on('comment:new', (c) => setComments((prev) => addUnique(prev, c)))
    })
    return () => { s?.disconnect() }
  }, [slug])

  // Add heading ids and build TOC for h2/h3
  const { htmlStr, toc } = useMemo(() => {
    const raw = DOMPurify.sanitize(post?.html || '')
    const headingRegex = /<h([2-3])>([^<]+)<\/h\1>/g
    let m; let idx = 0; const items = []
    let out = raw
    while ((m = headingRegex.exec(raw))) {
      const level = Number(m[1])
      const text = m[2]
      const id = (text || 'h').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + (++idx)
      items.push({ id, text, level })
      out = out.replace(m[0], `<h${level} id="${id}">${text}</h${level}>`)
    }
    return { htmlStr: out, toc: items }
  }, [post])
  const html = useMemo(() => ({ __html: htmlStr }), [htmlStr])

  async function toggleLike() {
    if (!me) return alert('Login to like posts')
    const r = await api.post(`/posts/${post._id}/like`)
    setPost(prev => ({ ...prev, likes: Array(r.data.likes).fill(0) }))
  }

  async function react(type) {
    if (!me) return alert('Login to react')
    const r = await api.post(`/posts/${post._id}/react/${type}`)
    setPost(prev => ({ ...prev, reactions: {
      clap: Array(r.data.counts.clap).fill(0),
      like: Array(r.data.counts.like).fill(0),
      fire: Array(r.data.counts.fire).fill(0),
    }}))
  }

// Save to collection (Instagram-style)
  const [saved, setSaved] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  useEffect(()=>{
    if (!post?._id) return;
    setSaved(isSavedInAnyCollection(post._id))
  }, [post?._id])
  function openSave(){ setSaveOpen(true) }
  function closeSave(){ setSaveOpen(false); if(post?._id) setSaved(isSavedInAnyCollection(post._id)) }

  // Share
  async function shareLink(){
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title || 'Post', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Link copied!')
      }
    } catch {}
  }

  // Reading progress
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    function onScroll() {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const height = el.scrollHeight - el.clientHeight
      setProgress(height > 0 ? Math.min(100, Math.max(0, (scrolled / height) * 100)) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return post ? (
    <div className="post-page">
      <div className="post-progress"><div className="post-progress-inner" style={{ width: `${progress}%` }} /></div>
      <div className="post-header">
        <h1 className="post-title">{post.title}</h1>
      </div>
      {(post.coverUrl || post.images?.[0]) && (
        <div className="post-cover">
          <BlurImg src={resolveMediaUrl(post.coverUrl || post.images?.[0])} alt="cover" className="post-cover-img" />
        </div>
      )}
      {!!post.images?.length && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {post.images.map((u, i) => {
            const src = resolveMediaUrl(u)
            if (!src) return null
            return <img key={`${src}-${i}`} src={src} alt="attachment" style={{ width: '100%', borderRadius: 10, objectFit: 'cover' }} loading="lazy" />
          })}
        </div>
      )}
      {toc.length > 0 && (
        <aside className="post-toc">
          <h4>On this page</h4>
          <ul>
            {toc.map((i)=> (
              <li key={i.id} className={`l${i.level}`}><a href={`#${i.id}`}>{i.text}</a></li>
            ))}
          </ul>
        </aside>
      )}
      <div className="post-body" dangerouslySetInnerHTML={html} />

      <div className="post-actions">
        <button onClick={toggleLike} className="action-btn heart-btn" title="Like">
          <span className="action-icon heart on">❤</span>
          <span className="action-count">{post.likes?.length || 0}</span>
        </button>
        <button onClick={()=>react('clap')} className="action-btn" title="Clap">
          <span className="action-icon">👏</span>
          <span className="action-count">{post.reactions?.clap?.length || 0}</span>
        </button>
        <button onClick={()=>react('fire')} className="action-btn" title="Fire">
          <span className="action-icon">🔥</span>
          <span className="action-count">{post.reactions?.fire?.length || 0}</span>
        </button>
        <button onClick={()=>setShowComments(v=>!v)} className="action-btn" title="Comments">
          <span className="action-icon">💬</span>
          <span className="action-count">{comments.length}</span>
        </button>
        <button onClick={openSave} className={`action-btn ${saved ? 'is-saved' : ''}`} title={saved? 'Saved' : 'Save'}>
          <span className="action-icon">🔖</span>
          <span className="action-count">{saved ? 'Saved' : 'Save'}</span>
        </button>
        <button onClick={shareLink} className="action-btn" title="Share">
          <span className="action-icon">🔗</span>
          <span className="action-count">Share</span>
        </button>
      </div>

      <SaveDialog open={saveOpen} postId={post._id} postMeta={{ _id: post._id, slug: post.slug, title: post.title, coverUrl: resolveMediaUrl(post.coverUrl || post.images?.[0] || ''), tags: post.tags, publishedAt: post.publishedAt || post.createdAt, author: { username: post.author?.username } }} onClose={closeSave} />

      {showComments && (
        <section className="comments-section" id="comments">
          <h3 className="comments-title">Comments</h3>
          <CommentList items={comments} />
          <CommentForm postId={post._id} onAdd={(c)=>setComments((prev)=>addUnique(prev, c))} />
        </section>
      )}
    </div>
  ) : <div>Loading...</div>
}

function addUnique(list, c) {
  if (!c?._id) return list
  if (list.some(x => x._id === c._id)) return list
  return [...list, c]
}
