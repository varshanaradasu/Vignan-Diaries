const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const router = express.Router();

// Only admins can access these endpoints
router.get('/stats', auth(true), authorize(['admin']), async (_req, res) => {
  const [userCount, postCount, commentCount, totalsAgg] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Comment.countDocuments(),
    Post.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
        }
      }
    ]),
  ]);
  const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(10).select('title author createdAt status').populate('author','username role');
  const totals = totalsAgg[0] || { totalLikes: 0, totalViews: 0 };
  res.json({ users: userCount, posts: postCount, comments: commentCount, likes: totals.totalLikes, views: totals.totalViews, recentPosts });
});

router.get('/users', auth(true), authorize(['admin']), async (_req, res) => {
  const users = await User.find().select('-passwordHash');
  res.json(users);
});

router.get('/posts', auth(true), authorize(['admin']), async (_req, res) => {
  const posts = await Post.find().populate('author','username role');
  res.json(posts);
});

module.exports = router;
