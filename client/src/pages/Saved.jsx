import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import SaveDialog from '../widgets/SaveDialog.jsx'
import ManageCollections from '../widgets/ManageCollections.jsx'
import { loadCollections, isSavedInAnyCollection, getSavedPostsByIds } from '../lib/collections'
import '../styles/Home.css'

export default function Saved() {
  const [collections, setCollections] = useState({})
  const [postsById, setPostsById] = useState({})
  const [loading, setLoading] = useState(true)
  // Show collections first; user picks one to view posts
  const [active, setActive] = useState(null)

  useEffect(() => {
    (async () => {
      const cols = await loadCollections()
      setCollections(cols)
      const allIds = [...new Set(Object.values(cols).flat())]
      if (allIds.length === 0) { setLoading(false); return }
      // Try fetch by id; if unavailable, fallback to local snapshots
      Promise.all(allIds.map(id => api.get(`/posts/${id}`).then(r => r.data).catch(()=>null)))
        .then(items => {
          const map = {}
          const fetched = items.filter(Boolean)
          fetched.forEach(p => { map[p._id] = p })
          const missing = allIds.filter(id => !map[id])
          if (missing.length) {
            const snaps = getSavedPostsByIds(missing)
            snaps.forEach(p => { map[p._id] = p })
          }
          setPostsById(map)
        })
        .finally(() => setLoading(false))
    })()
  }, [])

  const tabs = useMemo(() => Object.keys(collections), [collections])

  function postsFor(name) {
    if (name === 'All') {
      const ids = [...new Set(Object.values(collections).flat())]
      return ids.map(id => postsById[id]).filter(Boolean)
    }
    const ids = collections[name] || []
    return ids.map(id => postsById[id]).filter(Boolean)
  }

  return (
    <div className="home-container">
      <div className="page-header">
        <h1 className="page-title">Saved</h1>
        <p className="page-subtitle">Your saved posts by collection</p>
      </div>

      {tabs.length > 0 && (
        <div className="filter-section">
          <div className="filter-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Collections</span>
            <ManageButton />
          </div>
          <div className="tags-container">
            {tabs.map(t => (
              <button key={t} onClick={()=>setActive(t)} className={`tag-button ${active===t?'active':''}`}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {active === null ? (
        // Collections-first view: grid of collection cards
        <div className="posts-grid">
          {tabs.length === 0 ? (
            <div className="empty-posts">
              <div className="empty-posts-icon">📥</div>
              <h3>No collections yet</h3>
              <p>Save posts to create your first collection.</p>
            </div>
          ) : (
            tabs.map(name => {
              const ids = collections[name] || []
              const preview = ids.map(id => postsById[id]).find(Boolean)
              return (
                <article key={name} className="post-card" style={{ cursor:'pointer' }} onClick={()=>setActive(name)}>
                  <div className="post-card-header">
                    <div className="author-avatar">{name.charAt(0).toUpperCase()}</div>
                    <div className="author-info">
                      <div className="author-name">{name}</div>
                      <div className="post-date">{ids.length} saved</div>
                    </div>
                  </div>
                  {(() => {
                    const ids = collections[name] || []
                    const pics = ids.map(id => postsById[id]).filter(p=>p?.coverUrl).slice(0,3)
                    if (pics.length === 0) {
                      return (
                        <div style={{height:140, border:'1px dashed var(--color-border)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-light)'}}>
                          No preview
                        </div>
                      )
                    }
                    return (
                      <div style={{ display:'grid', gridTemplateColumns: pics.length>1?'1fr 1fr':'1fr', gap:6, marginBottom:'0.75rem' }}>
                        {pics.map((p,i)=> (
                          <img key={i} src={p.coverUrl} alt="" loading="lazy" style={{ width:'100%', borderRadius:12, objectFit:'cover', height: i===0 && pics.length===3 ? 140 : 86, gridColumn: i===0 && pics.length===3 ? '1 / span 2' : 'auto' }} />
                        ))}
                      </div>
                    )
                  })()}
                </article>
              )
            })
          )}
        </div>
      ) : loading ? (
        <div className="posts-grid">
          {[1,2].map(i => (
            <article key={i} className="post-card">
              <div className="post-card-header">
                <div className="author-avatar skeleton" style={{width:48,height:48}} />
                <div style={{flex:1}}>
                  <div className="skeleton" style={{height:12, width:'40%', borderRadius:6, marginBottom:6}} />
                  <div className="skeleton" style={{height:10, width:'30%', borderRadius:6}} />
                </div>
              </div>
              <div className="skeleton" style={{height:160, borderRadius:12, margin:'8px 0'}} />
              <div className="skeleton" style={{height:16, width:'70%', borderRadius:8, marginBottom:8}} />
              <div className="skeleton" style={{height:12, width:'50%', borderRadius:8}} />
            </article>
          ))}
        </div>
      ) : postsFor(active).length === 0 ? (
        <div className="empty-posts">
          <div className="empty-posts-icon">📥</div>
          <h3>No saved posts</h3>
          <p>Save posts from the feed or post page. They will appear here.</p>
        </div>
      ) : (
        <>
          <div className="filter-section" style={{ marginTop: '-0.5rem' }}>
            <div className="filter-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>Viewing: {active}</span>
              <div style={{ display:'flex', gap:8 }}>
                <ShareToggle name={active} />
                <button className="btn btn-small btn-ghost" onClick={()=>setActive(null)}>← Back to collections</button>
              </div>
            </div>
          </div>
          <div className="posts-grid">
          {postsFor(active).map(p => (
            <article key={p._id} className="post-card">
              <div className="post-card-header">
                <div className="author-avatar">{p.author?.username?.charAt(0).toUpperCase() || 'U'}</div>
                <div className="author-info">
                  <div className="author-name">{p.author?.username || 'Anonymous'}</div>
                  <div className="post-date">{new Date(p.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
              {p.coverUrl && (
                <div style={{ marginBottom: '1rem' }}>
                  <img src={p.coverUrl} alt="cover" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 260 }} />
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
              <div className="post-card-footer" style={{ justifyContent: 'flex-end' }}>
                <SaveInlineButton postId={p._id} onClose={()=>{ /* state stays in dialog */ }} />
              </div>
            </article>
          ))}
        </div>
        </>
      )}
    </div>
  )
}

function ShareToggle({ name }) {
  const [pub, setPub] = useState(false)
  const [copying, setCopying] = useState(false)
  useEffect(()=>{
    // no endpoint to read visibility; we optimistically toggle
  },[])
  async function toggle() {
    setPub(v=>!v)
    try { await api.put('/collections/visibility', { name, public: !pub }) } catch {}
  }
  async function copyLink() {
    setCopying(true)
    try {
      const user = JSON.parse(atob(localStorage.getItem('token')?.split('.')[1]||'null')||'null')
      const username = user?.username || 'user'
      await navigator.clipboard.writeText(`${window.location.origin}/c/${username}/${encodeURIComponent(name)}`)
    } finally { setCopying(false) }
  }
  return (
    <div style={{ display:'flex', gap: 6 }}>
      <button className={`btn btn-small ${pub?'btn-secondary':'btn-ghost'}`} onClick={toggle}>{pub?'Public':'Private'}</button>
      <button className="btn btn-small btn-secondary" onClick={copyLink}>{copying?'Copied':'Copy link'}</button>
    </div>
  )
}

function ManageButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn btn-small btn-secondary" onClick={()=>setOpen(true)}>Manage</button>
      <ManageCollections open={open} onClose={()=>setOpen(false)} />
    </>
  )
}

function SaveInlineButton({ postId }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(() => isSavedInAnyCollection(postId))
  function onClose(){ setOpen(false); setSaved(isSavedInAnyCollection(postId)) }
  return (
    <>
      <button onClick={()=>setOpen(true)} className={`btn btn-small btn-secondary ${saved?'is-saved':''}`}>
        {saved ? '🔖 Saved' : '🔖 Save'}
      </button>
      <SaveDialog open={open} postId={postId} onClose={onClose} />
    </>
  )
}
