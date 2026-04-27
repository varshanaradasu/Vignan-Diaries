import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I can help you discover posts and navigate the app. Ask about events, clubs, placements, research…' }])
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const history = nextMessages.slice(-10).map((m) => ({ role: m.role, content: m.text }))
      const r = await api.post('/ai/chat', { message: text, history })
      const reply = typeof r.data?.reply === 'string' ? r.data.reply : 'Sorry, I could not generate a response.'
      setMessages((m) => [...m, { role: 'assistant', text: reply, suggestions: r.data.suggestions || [], source: r.data.source, reason: r.data.reason }])
    } catch (e) {
      const msg = e?.response?.data?.error ? `${e.response.data.error}${e.response?.data?.reason ? `: ${e.response.data.reason}` : ''}` : 'Sorry, something went wrong.'
      setMessages((m) => [...m, { role: 'assistant', text: msg }])
    } finally {
      setLoading(false)
    }
  }

  function openSuggestion(s) {
    if (s?.slug) return window.location.href = `/post/${s.slug}`
    if (s?.query) return window.location.href = `/feed?query=${encodeURIComponent(s.query)}`
  }

  return (
    <div>
      {!open && (
        <button onClick={() => setOpen(true)} style={styles.fab}>🤖</button>
      )}
      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <div style={{ fontWeight: 700 }}>AI Assistant</div>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>×</button>
          </div>
          <div style={styles.list} ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...styles.msg, alignItems: m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ ...styles.bubble, background: m.role==='user'?'#667eea':'#f1f3ff', color: m.role==='user'?'white':'#333' }}>
                  {m.text}
                </div>
                {/* Hide debug source/reason from users */}
                {false && m.source && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>
                    source: {m.source}{m.reason ? ` (${m.reason})` : ''}
                  </div>
                )}
                {m.suggestions?.length ? (
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {m.suggestions.map((s) => (
                      <button key={s.slug || s.query} style={styles.suggestion} onClick={() => openSuggestion(s)}>
                        {s.coverUrl ? <img src={s.coverUrl} alt="" style={{ width: 36, height: 24, objectFit: 'cover', borderRadius: 4, marginRight: 6 }} /> : null}
                        {s.title || s.query}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div style={{ ...styles.msg, alignItems: 'flex-start' }}>
                <div style={{ ...styles.bubble, background: '#f1f3ff', color: '#333' }}>Thinking…</div>
              </div>
            ) : null}
          </div>
          <div style={styles.inputRow}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask me anything…" style={styles.input} onKeyDown={e=>{ if(e.key==='Enter') send() }} disabled={loading} />
            <button onClick={send} style={styles.sendBtn} disabled={loading}>{loading ? 'Sending…' : 'Send'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  fab: {
    position: 'fixed', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: 24
  },
  panel: {
    position: 'fixed', right: 20, bottom: 20, width: 360, height: 460, background: 'white', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  header: { padding: '10px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  list: { flex: 1, padding: 12, overflowY: 'auto', background: '#fafbff' },
  msg: { display: 'flex', flexDirection: 'column', marginBottom: 10 },
  bubble: { padding: '8px 12px', borderRadius: 12, maxWidth: '80%', whiteSpace: 'pre-wrap' },
  suggestion: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid #e0e0ff', background: 'white', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
  inputRow: { display: 'flex', padding: 10, borderTop: '1px solid #eee', gap: 8 },
  input: { flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 },
  sendBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' },
}
