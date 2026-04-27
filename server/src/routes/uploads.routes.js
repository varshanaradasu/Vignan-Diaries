const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

const router = express.Router();

function toAbsoluteUrl(req, url = '') {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${req.protocol}://${req.get('host')}${path}`;
}

// Upload image (legacy single) - allowed for student, faculty
router.post('/image', auth(true), authorize(['student','faculty']), upload.single('image'), (req, res) => {
  console.log('upload:image file =>', req.file);
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = toAbsoluteUrl(req, req.file.path || req.file.secure_url || req.file.url);
  res.status(201).json({ url });
});

// New: upload multiple files (images, videos, pdfs) in one request
router.post('/files', auth(true), authorize(['student','faculty']), upload.array('files', 12), (req, res) => {
  console.log('upload:files files =>', req.files);
  const files = (req.files || []).map(f => ({
    url: toAbsoluteUrl(req, f.path || f.secure_url || f.url),
    mimetype: f.mimetype,
    originalname: f.originalname,
    size: f.size,
  }));
  if (!files.length) return res.status(400).json({ error: 'No files uploaded' });
  res.status(201).json({ files });
});

module.exports = router;
