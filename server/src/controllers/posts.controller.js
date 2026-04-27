const slugify = require('slugify');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const { sanitizer } = require('../utils/sanitize');

const makeSlug = (title) =>
  slugify(title, { lower: true, strict: true, trim: true }) + '-' + Math.random().toString(36).slice(2, 6);

function toAbsoluteUrl(req, url = '') {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${req.protocol}://${req.get('host')}${path}`;
}

function normalizePostMedia(req, postLike) {
  if (!postLike) return postLike;
  const post = typeof postLike.toObject === 'function' ? postLike.toObject() : postLike;
  post.coverUrl = toAbsoluteUrl(req, post.coverUrl || '');
  post.images = Array.isArray(post.images) ? post.images.map((u) => toAbsoluteUrl(req, u)) : [];
  return post;
}

const createDraft = [
  body('title').isLength({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, markdown = '', tags = [], coverUrl, images = [] } = req.body;
    const slug = makeSlug(title);
    const post = await Post.create({
      title,
      slug,
      markdown,
      tags,
      coverUrl: toAbsoluteUrl(req, coverUrl || ''),
      images: Array.isArray(images) ? images.map((u) => toAbsoluteUrl(req, u)) : [],
      author: req.user.id,
      status: 'draft'
    });
    res.json(normalizePostMedia(req, post));
  },
];

const updateDraft = [
  body('title').optional().isLength({ min: 1 }),
  async (req, res) => {
    const { id } = req.params;
    const updates = (({ title, markdown, tags, coverUrl, images }) => ({ title, markdown, tags, coverUrl, images }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    if (updates.coverUrl !== undefined) updates.coverUrl = toAbsoluteUrl(req, updates.coverUrl || '');
    if (Array.isArray(updates.images)) updates.images = updates.images.map((u) => toAbsoluteUrl(req, u));
    const post = await Post.findOneAndUpdate({ _id: id, author: req.user.id }, updates, { new: true });
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(normalizePostMedia(req, post));
  },
];

const publish = async (req, res) => {
  const { id } = req.params;
  const post = await Post.findOne({ _id: id, author: req.user.id });
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.status = 'published';
  post.publishedAt = new Date();
  post.html = sanitizer(req.body.html || post.html);
  if (req.body.coverUrl) post.coverUrl = toAbsoluteUrl(req, req.body.coverUrl);
  await post.save();
  res.json(normalizePostMedia(req, post));
};

const feed = async (req, res) => {
  const { tag, author } = req.query;
  const q = { status: 'published' };
  if (tag) q.tags = tag;
  if (author) q.author = author;
  const posts = await Post.find(q).sort({ publishedAt: -1 }).select('-markdown').populate('author', 'username role');
  res.json(posts.map((p) => normalizePostMedia(req, p)));
};

const getBySlug = async (req, res) => {
  const { slug } = req.params;
  const post = await Post.findOne({ slug, status: 'published' }).populate('author', 'username role');
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.views += 1;
  await post.save();
  res.json(normalizePostMedia(req, post));
};

const like = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const idx = post.likes.findIndex((u) => u.toString() === userId);
  if (idx === -1) post.likes.push(userId);
  else post.likes.splice(idx, 1);
  await post.save();
  res.json({ likes: post.likes.length, liked: idx === -1 });
};

const tags = async (_req, res) => {
  const tags = await Post.distinct('tags', { status: 'published' });
  res.json(tags.sort());
};

const react = async (req, res) => {
  const { id, type } = { id: req.params.id, type: req.params.type };
  const post = await Post.findById(id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  const valid = ['clap','like','fire']
  if (!valid.includes(type)) return res.status(400).json({ error: 'invalid_reaction' })
  const arr = (post.reactions && post.reactions[type]) || (post.reactions[type] = [])
  const userId = req.user.id
  const idx = arr.findIndex(u => u.toString() === userId)
  if (idx === -1) arr.push(userId); else arr.splice(idx, 1)
  await post.save()
  res.json({ counts: {
    clap: post.reactions.clap.length,
    like: post.reactions.like.length,
    fire: post.reactions.fire.length,
  }, toggled: idx === -1 })
}

// New: list drafts for the logged-in author
const myDrafts = async (req, res) => {
  const drafts = await Post.find({ status: 'draft', author: req.user.id })
    .sort({ updatedAt: -1 })
    .select('title updatedAt status slug');
  res.json(drafts);
};

// New: get a post by ID (author-only for drafts)
const getById = async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.status === 'draft' && post.author.toString() !== req.user.id) {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.json(normalizePostMedia(req, post));
};

module.exports = { createDraft, updateDraft, publish, feed, getBySlug, like, tags, react, myDrafts, getById };
