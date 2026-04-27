import { useEffect, useState } from 'react'
import '../styles/Save.css'
import { loadCollections, saveCollections } from '../lib/collections'

export default function ManageCollections({ open, onClose }) {
  const [collections, setCollections] = useState({})
  const [editing, setEditing] = useState({})

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const cols = await loadCollections()
      setCollections(cols)
    })()
  }, [open])

  if (!open) return null

  function startEdit(oldName) {
    setEditing({ ...editing, [oldName]: oldName })
  }
  function setEditValue(oldName, v) {
    setEditing({ ...editing, [oldName]: v })
  }
  async function saveRename(oldName) {
    const newName = (editing[oldName]||'').trim()
    if (!newName || newName === oldName) { cancelEdit(oldName); return }
    if (collections[newName]) { cancelEdit(oldName); return }
    const cols = { ...collections }
    cols[newName] = cols[oldName] || []
    delete cols[oldName]
    setCollections(cols)
    await saveCollections(cols)
    cancelEdit(oldName)
  }
  function cancelEdit(oldName) {
    const c = { ...editing }
    delete c[oldName]
    setEditing(c)
  }
  async function remove(name) {
    if (!confirm(`Delete collection "${name}"?`)) return
    const cols = { ...collections }
    delete cols[name]
    setCollections(cols)
    await saveCollections(cols)
  }

  return (
    <div className="save-overlay" onClick={onClose}>
      <div className="save-modal" onClick={e=>e.stopPropagation()}>
        <div className="save-header">Manage collections</div>
        <div className="save-list">
          {Object.keys(collections).length === 0 && (
            <div style={{ padding: 12, color: 'var(--color-text-light)' }}>No collections yet.</div>
          )}
          {Object.keys(collections).map(name => (
            <div key={name} className="save-item" style={{ justifyContent: 'space-between' }}>
              {editing[name] !== undefined ? (
                <>
                  <input className="save-input" value={editing[name]} onChange={e=>setEditValue(name, e.target.value)} style={{ flex: 1 }} />
                  <div style={{ display:'flex', gap: 8 }}>
                    <button className="btn btn-small btn-primary" onClick={()=>saveRename(name)}>Save</button>
                    <button className="btn btn-small btn-ghost" onClick={()=>cancelEdit(name)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="save-name">{name}</div>
                  <div style={{ display:'flex', gap: 8 }}>
                    <button className="btn btn-small btn-secondary" onClick={()=>startEdit(name)}>Rename</button>
                    <button className="btn btn-small btn-ghost btn-danger" onClick={()=>remove(name)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="save-actions">
          <button className="btn btn-secondary btn-small" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
