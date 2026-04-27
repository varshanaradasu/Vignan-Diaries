const express = require('express');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const { generateText } = require('../services/ai');

const router = express.Router();


async function aiReply(message) {
  const text = await generateText(message);
  return { text, used: !!text, reason: text ? 'ok:openrouter' : 'empty_response' };
}

function isGreeting(s='') {
  const t = s.trim().toLowerCase();
  return /^(hi+|hello+|hey+|yo+|hola|namaste|namaskar|good\s*(morning|afternoon|evening)|sup)$/.test(t);
}

// Simple AI assistant: returns suggested posts and a helpful summary based on the question
router.post('/', auth(false), async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ reply: 'message is required' });

    // Greeting quick-reply
    if (isGreeting(message)) {
      return res.json({ reply: 'How can I help you?', suggestions: [
        { title: 'Placements', query: 'placements' },
        { title: 'Clubs', query: 'clubs' },
        { title: 'Events', query: 'events' },
        { title: 'Research', query: 'research' },
        { title: 'MERN', query: 'mern' },
        { title: 'AI', query: 'ai' },
      ] });
    }

    const text = message.toLowerCase();
    const stop = new Set(['about','the','and','or','for','with','what','is','are','a','an','to','of','in','on','at','by','from','me','my','you'])
    const words = (text.match(/[a-zA-Z0-9]{2,}/g) || []).map(w=>w.toLowerCase())
    const keywords = Array.from(new Set(words.filter(w=>!stop.has(w)))).slice(0, 10)
    const q = { status: 'published' };
    if (keywords.length) q.$or = [
      { title: { $regex: keywords.join('|'), $options: 'i' } },
      { tags: { $in: keywords } },
    ];
    let posts = await Post.find(q).limit(5).select('title slug tags coverUrl').sort({ publishedAt: -1 });

    // If no direct matches, show trending posts or top tags as suggestions
    let extraChips = []
    if (posts.length === 0) {
      try {
        const topTags = await Post.aggregate([
          { $match: { status: 'published' } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', c: { $sum: 1 } } },
          { $sort: { c: -1 } },
          { $limit: 6 },
        ])
        extraChips = topTags.map(t => ({ title: `#${t._id}`, query: t._id }))
        posts = await Post.find({ status: 'published' }).limit(3).select('title slug tags coverUrl').sort({ views: -1 })
      } catch {}
    }

    // Use AI response; else local tips
    let llm = await aiReply(message);
    const info = llm.text || generateHelpfulSummary(text, keywords);
    const postsLine = posts.length
      ? `I found ${posts.length} related post${posts.length>1?'s':''}.`
      : `No matching posts yet.`;
    const responseText = `${info}\n\n${postsLine}`;

    const debug = process.env.NODE_ENV !== 'production';
    res.json({ reply: responseText, suggestions: [...posts, ...extraChips], source: llm.used ? 'openrouter' : 'fallback', reason: debug ? llm.reason : undefined });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function generateHelpfulSummary(text, keywords) {
  const has = (w) => keywords.includes(w) || text.includes(w);
  if (has('vignan') || has('university')) {
    return 'I’m your campus assistant for Vignan Diaries. I can help you explore posts on placements, clubs, events and research. Ask something specific (e.g., “placements interview tips”, “clubs coding”, “events hackathon”), or tap a suggestion chip.';
  }
  if (has('placement') || has('placements') || has('jobs')) {
    return 'Placements: Build a concise resume (1 page), practice DSA and system design, and track drives via the Training & Placement Cell portal. Join mock interviews, contribute to projects on GitHub, and prepare STAR-format answers for HR.';
  }
  if (has('club') || has('clubs')) {
    return 'Clubs: Check university clubs (coding, robotics, cultural, sports). Attend orientation, join WhatsApp/Discord groups, and volunteer at events to grow your network and leadership.';
  }
  if (has('event') || has('fest') || has('hackathon')) {
    return 'Events: Keep an eye on the notice board and official Instagram handles. For hackathons, form a 3–4 member team, shortlist problem statements, and prepare a 3–5 minute demo with a simple deck.';
  }
  if (has('research') || has('paper') || has('journal')) {
    return 'Research: Identify a faculty mentor, pick a narrow topic, do a quick literature survey (last 3–5 years), and build a minimal prototype. Use Zotero/Scholar for references.';
  }
  if (has('exam') || has('schedule') || has('timetable')) {
    return 'Exams: Review the timetable from the exam cell, prepare a formula sheet, and practice previous papers. Space your revision with Pomodoro (25/5) and sleep well before exam day.';
  }
  if (has('admission') || has('fee') || has('scholarship')) {
    return 'Admissions & Fees: Visit the admissions portal for deadlines. For scholarships, prepare income certificates and previous marksheets; apply early and track application status online.';
  }
  // Default generic helper
  return 'Here’s a quick guide: define your goal, list 3–5 actionable steps, set a timeline, and share progress with peers or faculty for feedback. I can also fetch related posts for inspiration.';
}

module.exports = router;
