const express = require('express');
const { rate } = require('../middleware/rateLimit');
const { generateText } = require('../services/ai');

const router = express.Router();

// Helper to standardize errors
function safe(res, fn) {
  return Promise.resolve(fn()).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });
}

function parseJsonArray(text = '') {
  const cleaned = String(text).replace(/```json|```/gi, '').trim();
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [];
}

async function askAI(prompt) {
  const text = await generateText(prompt);
  if (!text) {
    const err = new Error('empty_response');
    throw err;
  }
  return text;
}

router.post('/chat', rate('ai:chat', 30, 60_000), (req, res) => safe(res, async () => {
  const { message = '' } = req.body || {};
  if (!String(message).trim()) return res.status(400).json({ error: 'message_required' });
  const reply = await askAI(message);
  res.json({ reply });
}));

router.post('/rewrite', rate('ai:rewrite', 20, 60_000), (req, res) => safe(res, async () => {
  const { text = '', intent = 'improve', context = '' } = req.body || {};
  if (!text.trim()) return res.status(400).json({ error: 'text_required' });
  const map = {
    improve: 'Improve the tone and clarity while keeping meaning intact. Keep markdown formatting. Return only the improved text.',
    concise: 'Rewrite to be 30% shorter, preserving key points. Keep markdown formatting. Return only the revised text.',
    explain: 'Rewrite for a beginner. Use simple language and short sentences. Keep markdown formatting. Return only the rewritten text.'
  };
  const instruction = map[intent] || map.improve;
  const out = await askAI(`${instruction}\n\n${context ? `Context: ${context}\n\n` : ''}Input:\n${text}`);
  res.json({ text: out });
}));

router.post('/tags', rate('ai:tags', 20, 60_000), (req, res) => safe(res, async () => {
  const { text = '' } = req.body || {};
  if (!text.trim()) return res.status(400).json({ error: 'text_required' });
  const out = await askAI(`Return ONLY comma-separated tags without explanation:\n${text}`);
  const tags = String(out)
    .split(',')
    .map((s) => s.trim().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, 10);
  res.json({ tags, text: String(out).trim() });
}));

router.post('/summarize', rate('ai:summarize', 20, 60_000), (req, res) => safe(res, async () => {
  const { text = '' } = req.body || {};
  if (!text.trim()) return res.status(400).json({ error: 'text_required' });
  const out = await askAI(`Summarize this in 2 lines:\n${text}`);
  res.json({ summary: out.trim() });
}));

async function tweetHandler(req, res) {
  const { text = '' } = req.body || {};
  if (!text.trim()) return res.status(400).json({ error: 'text_required' });
  const out = await askAI(`Convert into Twitter thread:\n${text}`);
  try {
    const tweets = parseJsonArray(out);
    res.json({ tweets: Array.isArray(tweets) ? tweets : [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

router.post('/tweet_thread', rate('ai:tweet', 20, 60_000), (req, res) => safe(res, () => tweetHandler(req, res)));
router.post('/tweet', rate('ai:tweet2', 20, 60_000), (req, res) => safe(res, () => tweetHandler(req, res)));

router.post('/translate', rate('ai:translate', 20, 60_000), (req, res) => safe(res, async () => {
  const { text = '', targetLang = 'Hindi' } = req.body || {};
  if (!text.trim()) return res.status(400).json({ error: 'text_required' });
  const out = await askAI(`Translate the following content to ${targetLang}. Keep markdown formatting. Return only the translated text.\n\n${text}`);
  res.json({ text: out.trim(), lang: targetLang });
}));

router.post('/embeddings', rate('ai:embed', 10, 60_000), (_req, res) => {
  res.status(501).json({ error: 'not_implemented' });
});

router.get('/debug', (_req, res) => {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  res.json({
    ok: true,
    openrouter: {
      hasKey: hasOpenRouter,
      model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
    }
  });
});

module.exports = router;
