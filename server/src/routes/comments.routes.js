const express = require('express');
const auth = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimit');
const { list, create } = require('../controllers/comments.controller');

const router = express.Router({ mergeParams: true });

// Nested under posts in usage, but also expose flat
router.get('/:postId', list);
router.post('/:postId', auth(false), commentLimiter, create);

module.exports = router;
