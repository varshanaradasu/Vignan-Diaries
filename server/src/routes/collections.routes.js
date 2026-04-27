const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get collections for current user
router.get('/', auth(true), async (req, res) => {
  const user = await User.findById(req.user.id).select('collections');
  if (!user) return res.status(404).json({});
  const cols = Object.fromEntries((user.collections || new Map()).entries());
  // Convert ObjectId arrays to string arrays
  for (const k of Object.keys(cols)) cols[k] = (cols[k] || []).map(x => String(x));
  res.json(cols);
});

// Replace collections for current user
router.put('/', auth(true), async (req, res) => {
  const body = req.body || {};
  // Basic validation: body should be { [name]: string[] }
  const map = new Map();
  Object.keys(body).forEach((name) => {
    const arr = Array.isArray(body[name]) ? body[name] : [];
    map.set(name, arr);
  });
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({});
  user.collections = map;
  await user.save();
  res.json({ ok: true });
});

// Toggle visibility of a collection (public shareable)
router.put('/visibility', auth(true), async (req, res) => {
  const { name, public: isPublic } = req.body || {}
  if (!name || typeof isPublic !== 'boolean') return res.status(400).json({ error: 'invalid_payload' })
  const User = require('../models/User')
  const user = await User.findById(req.user.id)
  if (!user) return res.status(404).json({})
  if (!user.collectionsPublic) user.collectionsPublic = new Map()
  user.collectionsPublic.set(name, !!isPublic)
  await user.save()
  res.json({ ok: true })
})

// Public view of a collection
router.get('/public/:username/:name', async (req, res) => {
  const { username, name } = req.params
  const User = require('../models/User')
  const user = await User.findOne({ username }).select('collections collectionsPublic')
  if (!user) return res.status(404).json({ error: 'not_found' })
  const isPublic = (user.collectionsPublic && user.collectionsPublic.get(name)) || false
  if (!isPublic) return res.status(403).json({ error: 'not_public' })
  const ids = (user.collections && user.collections.get(name)) || []
  const Post = require('../models/Post')
  const posts = await Post.find({ _id: { $in: ids } }).select('title slug tags coverUrl publishedAt').sort({ publishedAt: -1 })
  res.json({ owner: username, name, posts })
})

module.exports = router;
