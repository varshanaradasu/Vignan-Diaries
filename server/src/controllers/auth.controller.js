const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const nodemailer = require('nodemailer');

function issueAuthToken(user) {
  if (!process.env.JWT_SECRET) {
    const err = new Error('JWT secret is missing');
    err.code = 'CONFIG_JWT_SECRET';
    throw err;
  }
  return jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const validate = [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['student', 'faculty', 'admin']),
];

const register = [
  ...validate,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, email, password, role: requestedRole, fullName, department, universityId, adminCode } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    // Only allow public registration as student or faculty. Admin requires admin code.
    let role = ['student', 'faculty'].includes(requestedRole) ? requestedRole : 'student';
    if (requestedRole === 'admin') {
      if (!adminCode || adminCode !== process.env.ADMIN_REG_CODE) {
        return res.status(403).json({ error: 'Admin registration not allowed' });
      }
      role = 'admin';
    }

    try {
      const user = await User.create({ username, email, passwordHash, role, fullName, department, universityId });
      const token = issueAuthToken(user);
      res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'Username or email already exists' });
      if (e.code === 'CONFIG_JWT_SECRET') return res.status(500).json({ error: 'Server auth configuration missing' });
      if (e.name === 'ValidationError') return res.status(400).json({ error: e.message });
      res.status(500).json({ error: e.message || 'Registration failed' });
    }
  },
];

const login = [
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = issueAuthToken(user);
      res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (e) {
      if (e.code === 'CONFIG_JWT_SECRET') return res.status(500).json({ error: 'Server auth configuration missing' });
      res.status(500).json({ error: e.message || 'Login failed' });
    }
  },
];

// --- Password reset via OTP ---
function makeTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Fallback: log emails to console during development
  return {
    sendMail: async (opts) => {
      console.log('[MAIL:FALLBACK] To:', opts.to, 'Subject:', opts.subject, 'Text:', opts.text);
      return true;
    },
  };
}
const transporter = makeTransport();

const forgotPassword = [
  body('email').isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ ok: true }); // do not reveal users
    const otp = ('' + Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(otp, 10);
    user.resetOtpHash = hash;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';
    await transporter.sendMail({
      from,
      to: user.email,
      subject: 'Your password reset code',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });
    res.json({ ok: true });
  }
];

const resetPassword = [
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, otp, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetOtpHash || !user.resetOtpExpires) return res.status(400).json({ error: 'invalid_or_expired' });
    if (Date.now() > new Date(user.resetOtpExpires).getTime()) return res.status(400).json({ error: 'invalid_or_expired' });
    const ok = await bcrypt.compare(otp, user.resetOtpHash);
    if (!ok) return res.status(400).json({ error: 'invalid_or_expired' });
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    const token = issueAuthToken(user);
    res.json({ ok: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  }
];

module.exports = { register, login, forgotPassword, resetPassword };
