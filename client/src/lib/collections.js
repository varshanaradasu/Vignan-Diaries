import { api } from '../api'
import { getToken } from './auth'

const LS_KEY = 'collections'
const SNAP_KEY = 'saved_posts'

export function getCollectionsLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
export function setCollectionsLocal(cols) {
  localStorage.setItem(LS_KEY, JSON.stringify(cols || {}))
}
export function isSavedInAnyCollection(postId) {
  const cols = getCollectionsLocal()
  return Object.values(cols).some(arr => Array.isArray(arr) && arr.includes(postId))
}

// Local snapshots for saved posts (used if backend fetch by id is unavailable)
export function upsertSavedPostSnapshot(post) {
  if (!post || !post._id) return
  const map = getSavedPostMapLocal()
  map[post._id] = pickPostFields(post)
  localStorage.setItem(SNAP_KEY, JSON.stringify(map))
}
export function getSavedPostsByIds(ids=[]) {
  const map = getSavedPostMapLocal()
  return ids.map(id => map[id]).filter(Boolean)
}
function getSavedPostMapLocal() {
  try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '{}') } catch { return {} }
}
function pickPostFields(p) {
  return {
    _id: p._id,
    slug: p.slug,
    title: p.title,
    coverUrl: p.coverUrl,
    tags: p.tags || [],
    publishedAt: p.publishedAt || p.createdAt,
    author: p.author && typeof p.author === 'object' ? { username: p.author.username } : undefined,
  }
}

export async function loadCollections() {
  const token = getToken()
  if (!token) return getCollectionsLocal()
  try {
    const r = await api.get('/collections')
    const data = r.data && typeof r.data === 'object' ? r.data : {}
    setCollectionsLocal(data)
    return data
  } catch {
    return getCollectionsLocal()
  }
}

export async function saveCollections(cols) {
  setCollectionsLocal(cols)
  const token = getToken()
  if (!token) return cols
  try {
    await api.put('/collections', cols)
  } catch {
    // stay local if server not available
  }
  return cols
}
