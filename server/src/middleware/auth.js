const jwt = require('jsonwebtoken');

module.exports = function auth(required = true) {
  return function (req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return required ? res.status(401).json({ error: 'Unauthorized' }) : next();
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // { id, username }
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
