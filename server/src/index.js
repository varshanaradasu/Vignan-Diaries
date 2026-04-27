const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/posts.routes');
const commentRoutes = require('./routes/comments.routes');
const adminRoutes = require('./routes/admin.routes');
const assistantRoutes = require('./routes/assistant.routes');
const uploadRoutes = require('./routes/uploads.routes');
const collectionsRoutes = require('./routes/collections.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();
const server = http.createServer(app);

// Local development CORS
const allowedOrigins = [
  "http://localhost:5173"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join_post', (postId) => {
    socket.join(`post:${postId}`);
  });
});

// ✅ Apply same CORS policy to Express
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy does not allow access from origin ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Static uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', require('./routes/ai.routes'));

// ✅ Correct PORT
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server', err);
    process.exit(1);
  }
})();
