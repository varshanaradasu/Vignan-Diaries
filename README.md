# MERN Blogging Platform

A full-stack blogging platform built with MongoDB, Express, React, and Node.js.

## Features

- ✍️ Create and publish blog posts with Markdown editor
- 🏷️ Tag-based filtering
- 💬 Real-time commenting with Socket.io
- 👤 User authentication (register/login)
- ❤️ Like posts
- 📊 View count tracking
- 🛡️ Content sanitization and profanity filtering
- 📱 Responsive design

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Socket.io for real-time updates
- Express rate limiting
- Sanitize-html for XSS protection

### Frontend
- React 19 + Vite
- React Router for navigation
- Axios for API calls
- React Markdown Editor
- DOMPurify for HTML sanitization
- Socket.io client

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Clone the repository and navigate to the project folder

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Environment variables are already configured:
   - `server/.env` - Backend configuration with MongoDB connection
   - `client/.env` - Frontend configuration with API URL

### Running the Application

#### Option 1: Run separately (recommended for development)

Open two terminal windows:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```
Server will run on http://localhost:5000

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
Client will run on http://localhost:5173

#### Option 2: Run from root directory

**Start Server:**
```bash
npm run server
```

**Start Client (in another terminal):**
```bash
npm run client
```

## Usage

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Create a new post using the "New Post" button
4. Add markdown content and tags
5. Publish your post
6. Browse posts, filter by tags, like, and comment

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get all published posts (with optional tag filter)
- `GET /api/posts/tags` - Get all unique tags
- `GET /api/posts/slug/:slug` - Get post by slug
- `POST /api/posts/drafts` - Create draft (auth required)
- `PUT /api/posts/:id` - Update draft (auth required)
- `POST /api/posts/:id/publish` - Publish post (auth required)
- `POST /api/posts/:id/like` - Like/unlike post (auth required)

### Comments
- `GET /api/comments/:postId` - Get comments for a post
- `POST /api/comments/:postId` - Create comment (rate limited)

## Project Structure

```
Blogging-mern/
├── server/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth & rate limiting
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Server entry point
│   ├── .env                # Environment variables
│   └── package.json
├── client/
│   ├── src/
│   │   ├── lib/            # Auth utilities
│   │   ├── pages/          # React page components
│   │   ├── widgets/        # Reusable components
│   │   ├── App.jsx         # Main app component
│   │   ├── api.js          # Axios configuration
│   │   └── main.jsx        # Entry point
│   ├── .env                # Environment variables
│   └── package.json
└── README.md
```

## MongoDB Connection

The project is configured to use MongoDB Atlas with the following connection:
- Database: `blogging-mern`
- Collection: Automatically created (users, posts, comments)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- HTML sanitization to prevent XSS
- Profanity filtering in comments
- Rate limiting on comment endpoints
- CORS configuration
- Input validation with express-validator

## License

ISC
