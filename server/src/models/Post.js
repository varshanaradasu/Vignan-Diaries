const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    markdown: { type: String, default: '' },
    html: { type: String, default: '' },
    tags: { type: [String], index: true, default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverUrl: { type: String },
    images: [{ type: String }],
    coverImage: { type: String },
    attachments: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: {
      clap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      fire: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
