const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { sanitizer } = require('../utils/sanitize');

// Simple profanity word list
const badWords = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap'];
const filterProfanity = (text) => {
  let filtered = text;
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
};

const list = async (req, res) => {
  const { postId } = req.params;
  const comments = await Comment.find({ post: postId }).sort({ createdAt: 1 });
  res.json(comments);
};

const create = [
  body('content').isLength({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { postId } = req.params;
    const { content, authorName } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Simple profanity filter
    const cleanText = filterProfanity(content);
    const html = sanitizer(cleanText);

    const doc = await Comment.create({
      post: post._id,
      author: req.user?.id || undefined,
      authorName: req.user?.username || authorName || 'Guest',
      content: html,
    });

    // Broadcast to room for real-time updates
    const io = req.app.get('io');
    io.to(`post:${post._id}`).emit('comment:new', doc);

    res.status(201).json(doc);
  },
];

module.exports = { list, create };