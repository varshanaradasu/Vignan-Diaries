// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Limit for comments (basic)
const commentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Generic rate limiter factory for custom routes
function rate(key = 'default', max = 30, windowMs = 60 * 1000) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // ✅ Safe for IPv6
    keyGenerator: (req) => `${ipKeyGenerator(req)}:${key}`,
  });
}

module.exports = { commentLimiter, rate };
