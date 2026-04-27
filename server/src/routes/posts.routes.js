const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { createDraft, updateDraft, publish, feed, getBySlug, like, tags, react, myDrafts, getById } = require('../controllers/posts.controller');

const router = express.Router();

// Feed and tags
router.get('/', feed);
router.get('/tags', tags);

// By slug or id
router.get('/slug/:slug', getBySlug);
router.get('/id/:id', auth(true), getById);

// Drafts (author-only)
router.get('/drafts', auth(true), myDrafts);
router.post('/drafts', auth(true), authorize(['student', 'faculty']), createDraft);

// Author-only actions (students and faculty can post; admins inherit via authorize)
router.put('/:id', auth(true), authorize(['student', 'faculty']), updateDraft);
router.post('/:id/publish', auth(true), authorize(['student', 'faculty']), publish);
router.post('/:id/like', auth(true), like);
router.post('/:id/react/:type', auth(true), react);
router.delete('/:id', auth(true), async (req, res) => {
  const { id } = req.params;
  const Post = require('../models/Post');
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin && post.author.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
});

module.exports = router;
