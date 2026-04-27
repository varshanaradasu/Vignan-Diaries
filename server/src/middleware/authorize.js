module.exports = function authorize(roles = []) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = req.user.role;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });
    // Admin bypasses specific role checks
    if (role === 'admin') return next();
    if (roles.length && !roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
