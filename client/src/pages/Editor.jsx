import { useEffect, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { marked } from 'marked'
import { api } from '../api'
import { getToken, API_URL, getUser } from '../lib/auth'

import '../styles/Editor.css'

export default function Editor() {
  const [title, setTitle] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [tags, setTags] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [draftId, setDraftId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState([]) // array of urls
  const navigate = useNavigate()
  const location = useLocation()
  const saveTimer = useRef(null)

  const isAuthed = !!getToken()
  const user = getUser()
  const userCacheKey = user ? `draft_cache_${user.id}` : null

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const draftIdParam = params.get('id')

    if (draftIdParam) {
      // Explicit ID present: load that draft/post (server enforces author checks for drafts)
      ;(async () => {
        try {
          const r = await api.get(`/posts/id/${draftIdParam}`)
          const p = r.data || {}
          setDraftId(p._id)
          setTitle(p.title || '')
          setMarkdown(p.markdown || '')
          setTags((p.tags || []).join(','))
          setCoverUrl(p.coverUrl || '')
          setAttachments(p.images || [])
        } catch (e) {
          console.error('Failed to load draft', e)
        }
      })()
      return
    }

    // No ID in query: start fresh (blank editor). Do not hydrate from any cache.
    setDraftId(null)
    setTitle('')
    setMarkdown('')
    setTags('')
    setCoverUrl('')
    setAttachments([])

    // Clear any stale global cache from older versions to prevent cross-user leakage
    try { localStorage.removeItem('draft_cache') } catch {}

  }, [location.search])

  // Optional: keep a user-scoped cache while editing, so refresh doesn't lose work in-session.
  useEffect(() => {
    if (!userCacheKey) return
    const payload = { title, markdown, tags, coverUrl, attachments }
    try { localStorage.setItem(userCacheKey, JSON.stringify(payload)) } catch {}
  }, [title, markdown, tags, coverUrl, attachments, userCacheKey])

  function scheduleSave(overrides = {}) {
    if (!isAuthed) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        const effective = {
          title,
          markdown,
          tags,
          coverUrl,
          attachments,
          ...overrides,
        }
        const payload = {
          title: effective.title,
          markdown: effective.markdown,
          tags: tagsToArray(effective.tags),
          coverUrl: effective.coverUrl || undefined,
          images: effective.attachments,
        }
        if (!draftId) {
          const r = await api.post('/posts/drafts', payload)
          setDraftId(r.data._id)
        } else {
          await api.put(`/posts/${draftId}`, payload)
        }
      } finally {
        setSaving(false)
      }
    }, 800)
  }

  async function onUploadCover(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('image', file)
    const r = await api.post('/uploads/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    const url = r.data.url || ''
    const absolute = url.startsWith('http') ? url : `${API_URL}${url}`
    setCoverUrl(absolute)
    scheduleSave({ coverUrl: absolute })
  }

  async function onUploadFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const form = new FormData()
    for (const f of files) form.append('files', f)
    const r = await api.post('/uploads/files', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    const urls = (r.data.files || []).map(f => f.url.startsWith('http') ? f.url : `${API_URL}${f.url}`)
    const nextAttachments = [...attachments, ...urls]
    setAttachments(nextAttachments)
    scheduleSave({ attachments: nextAttachments })
  }

  async function onPublish() {
    if (!draftId) return alert('Draft not saved yet')
    const html = marked.parse(markdown)
    const r = await api.post(`/posts/${draftId}/publish`, { html, coverUrl: coverUrl || undefined })
    // Clear any possible caches after publish
    try { if (userCacheKey) localStorage.removeItem(userCacheKey) } catch {}
    try { localStorage.removeItem('draft_cache') } catch {}
    navigate(`/post/${r.data.slug}`)
  }

  return (
    <div className="editor-page">
      {!isAuthed && (
        <div className="banner-warning animate-pop">Login to autosave and publish.</div>
      )}
      <div className="editor-card animate-fade">
        <div className="editor-header">
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); scheduleSave() }}
            placeholder="Post title"
            className="editor-title"
          />
          <div className="saving-indicator">
            {saving ? <span className="dot-flash">Saving…</span> : <span className="saved">Saved</span>}
            <EditorStats title={title} markdown={markdown} />
          </div>
        </div>
        <input
          value={tags}
          onChange={e => { setTags(e.target.value); scheduleSave() }}
          placeholder="tags comma,separated"
          className="editor-tags"
        />
        <div className="editor-cover">
          <label className="cover-label">Cover Image</label>
          <input type="file" accept="image/*" onChange={onUploadCover} />
          {coverUrl && (
            <div className="cover-preview animate-pop" style={{ position: 'relative' }}>
              <img src={coverUrl} alt="cover" />
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => { setCoverUrl(''); scheduleSave() }}
                style={{ position: 'absolute', top: 8, right: 8 }}
              >
                Remove cover
              </button>
            </div>
          )}
        </div>
        <div className="editor-attachments" style={{ marginTop: 12 }}>
          <label className="cover-label">Attachments</label>
          <input type="file" multiple accept="image/*,video/*,application/pdf" onChange={onUploadFiles} />
          {!!attachments.length && (
            <div className="attachments-grid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {attachments.map((url, i) => (
                <AttachmentPreview
                  key={url + i}
                  url={url}
                  onRemove={() => { setAttachments(prev => prev.filter((_, idx) => idx !== i)); scheduleSave() }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="ai-toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
          <AIToolbar markdown={markdown} title={title} setMarkdown={setMarkdown} setTags={setTags} />
        </div>
        <div data-color-mode="light" className="md-wrap animate-fade">
          <MDEditor value={markdown} onChange={(v) => { setMarkdown(v || ''); scheduleSave() }} height={420} />
        </div>
        <div className="editor-actions">
          <button onClick={onPublish} disabled={!isAuthed || saving} className="btn btn-primary btn-large pulse">
            Publish
          </button>
        </div>
      </div>
    </div>
  )
}

function tagsToArray(s) {
  return s.split(',').map(t => t.trim()).filter(Boolean)
}

function EditorStats({ title, markdown }) {
  const words = (title + ' ' + (markdown||'')).trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return (
    <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 4 }}>
      {words} words • {minutes} min read
    </div>
  )
}

function AttachmentPreview({ url, onRemove }) {
  const type = (() => {
    const u = url.toLowerCase()
    if (u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.avi') || u.includes('/video')) return 'video'
    if (u.endsWith('.pdf')) return 'pdf'
    return 'image'
  })()
  const wrapStyle = { position: 'relative', width: 160, height: 100 }
  const removeBtn = (
    <button type="button" className="btn btn-ghost btn-small" onClick={onRemove} style={{ position: 'absolute', top: 4, right: 4 }}>
      ✕
    </button>
  )
  if (type === 'video') return (
    <div style={wrapStyle}>
      <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
      {onRemove ? removeBtn : null}
    </div>
  )
  if (type === 'pdf') return (
    <div style={wrapStyle}>
      <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-small">📄 PDF</a>
      {onRemove ? removeBtn : null}
    </div>
  )
  return (
    <div style={wrapStyle}>
      <img src={url} alt="attachment" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
      {onRemove ? removeBtn : null}
    </div>
  )
}

function AIToolbar({ markdown, title, setMarkdown, setTags }) {
  const [busy, setBusy] = useState(false)

  async function call(path, payload) {
    setBusy(true)
    try {
      const r = await api.post(path, payload)
      return r.data
    } catch (e) {
      const err = e?.response?.data
      const msg = (err?.error ? `${err.error}${err?.reason ? `: ${err.reason}` : ''}` : null) || e?.message || 'AI request failed'
      alert(msg)
      return null
    } finally {
      setBusy(false)
    }
  }

  async function onRewrite(intent) {
    const data = await call('/ai/rewrite', { intent, text: markdown, context: `Title: ${title}` })
    if (data?.text) setMarkdown(data.text)
  }

  async function onTags() {
    const data = await call('/ai/tags', { text: `${title}\n\n${markdown}` })
    const text = typeof data?.text === 'string' ? data.text : ''
    let tags = Array.isArray(data?.tags) ? data.tags : null
    if (!tags && text) tags = text.split(',').map(t => t.trim()).filter(Boolean)
    if (Array.isArray(tags) && tags.length) setTags(tags.map(String).join(','))
  }

  async function onSummarize() {
    const data = await call('/ai/summarize', { text: markdown, lines: 3 })
    const summary = typeof data?.text === 'string' ? data.text : data?.summary
    if (summary) setMarkdown(prev => `> Summary\n> ${summary.replace(/\n/g, '\n> ')}\n\n` + prev)
  }

  async function onTranslate() {
    const targetLang = prompt('Translate to language (e.g., Hindi, Telugu, French):', 'Hindi')
    if (!targetLang) return
    const data = await call('/ai/translate', { text: markdown, targetLang })
    if (data?.text) setMarkdown(data.text)
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ width: 1, background: '#eee' }} />
      <button className="btn btn-ghost btn-small" onClick={onSummarize} disabled={busy}>Summarize</button>
      <button className="btn btn-ghost btn-small" onClick={onTags} disabled={busy}>Generate tags</button>
    </div>
  )
}
