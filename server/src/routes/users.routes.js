const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get basic public user info by username
router.get('/:username', async (req, res) => {
  const { username } = req.params
  const user = await User.findOne({ username }).select('username role bio avatarUrl')
  if (!user) return res.status(404).json({ error: 'not_found' })
  res.json(user)
})

module.exports = router;
