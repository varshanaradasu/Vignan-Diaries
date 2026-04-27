import { useEffect, useState } from 'react'
import '../styles/Save.css'
import { loadCollections, saveCollections, upsertSavedPostSnapshot } from '../lib/collections'

export default function SaveDialog({ open, postId, onClose, postMeta }) {
  const [collections, setCollections] = useState({})
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const cols0 = await loadCollections()
      const cols = { ...cols0 }
      if (Object.keys(cols).length === 0) {
        cols['Saved'] = []
        await saveCollections(cols)
      }
      setCollections(cols)
    })()
  }, [open])

  async function toggleCollection(name) {
    const cols = { ...collections }
    const list = new Set(cols[name] || [])
    const adding = !list.has(postId)
    if (adding) {
      list.add(postId)
      if (postMeta) upsertSavedPostSnapshot(postMeta)
    } else {
      list.delete(postId)
    }
    cols[name] = [...list]
    setCollections(cols)
    await saveCollections(cols)
  }

  async function createCollection(e) {
    e?.preventDefault?.()
    const name = newName.trim()
    if (!name) return
    if (collections[name]) return setNewName('')
    const cols = { ...collections, [name]: [] }
    setCollections(cols)
    await saveCollections(cols)
    setNewName('')
  }

  if (!open) return null

  return (
    <div className="save-overlay" onClick={onClose}>
      <div className="save-modal" onClick={e=>e.stopPropagation()}>
        <div className="save-header">Save to</div>
        <div className="save-list">
          {Object.keys(collections).map(name => {
            const checked = (collections[name] || []).includes(postId)
            return (
              <label key={name} className="save-item">
                <span className="save-left">
                  <span className="save-avatar">{name?.charAt(0)?.toUpperCase() || 'S'}</span>
                  <span className="save-name">{name}</span>
                </span>
                <input className="save-check" type="checkbox" checked={checked} onChange={()=>toggleCollection(name)} />
              </label>
            )
          })}
        </div>
        <form className="save-new" onSubmit={createCollection}>
          <input className="save-input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New collection" />
          <button type="submit" className="btn btn-primary btn-small">Create</button>
        </form>
        <div className="save-actions">
          <button className="btn btn-secondary btn-small" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
