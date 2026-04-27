import { useState } from 'react'
import { api } from '../api'

export default function CommentForm({ postId, onAdd }) {
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      const r = await api.post(`/comments/${postId}`, { content: text, authorName: name })
      onAdd?.(r.data)
      setText('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="comment-form">
      <input className="cf-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name (optional)" />
      <textarea className="cf-textarea" value={text} onChange={e=>setText(e.target.value)} placeholder="Write a comment" />
      <div className="cf-actions">
        <button className="btn btn-primary btn-small" type="submit" disabled={loading}>Post Comment</button>
      </div>
    </form>
  )
}
