export const API_URL = import.meta.env.VITE_API_URL;

function clearDraftCaches() {
  try {
    // legacy cache key
    localStorage.removeItem('draft_cache');
    // remove any user-scoped caches created by Editor.jsx
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('draft_cache_')) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function getToken() {
  // Prefer sessionStorage so closing the tab logs out automatically
  let t = sessionStorage.getItem('token');
  // Migration: if token is in localStorage from older versions, move it
  if (!t) {
    const lt = localStorage.getItem('token');
    if (lt) {
      sessionStorage.setItem('token', lt);
      localStorage.removeItem('token');
      t = lt;
    }
  }
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    // If token has expired, clear it and treat as logged out
    if (payload?.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      clearDraftCaches();
      return null;
    }
  } catch {}
  return t;
}

export function setToken(t) {
  // Switching users: proactively clear any stale draft caches
  clearDraftCaches();
  // Store only in sessionStorage so session ends when the tab is closed
  sessionStorage.setItem('token', t);
  localStorage.removeItem('token');
}

export function clearToken() {
  sessionStorage.removeItem('token');
  localStorage.removeItem('token');
  // Logging out: clear caches so the next user never sees previous drafts
  clearDraftCaches();
}

export function getUser() {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}
