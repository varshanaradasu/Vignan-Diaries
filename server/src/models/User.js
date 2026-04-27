const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    // Roles for Vignan University portal: student, faculty, admin
    role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student', index: true },
    fullName: { type: String, trim: true },
    department: { type: String, trim: true },
    universityId: { type: String, trim: true }, // roll number or employee id
    bio: String,
    avatarUrl: String,
    // Saved collections: { [collectionName]: [postId] }
    collections: { type: Map, of: [mongoose.Schema.Types.ObjectId], default: {} },
    // Public visibility per collection
    collectionsPublic: { type: Map, of: Boolean, default: {} },
  },
  { timestamps: true }
);

// Password reset (OTP)
userSchema.add({
  resetOtpHash: { type: String },
  resetOtpExpires: { type: Date },
});

module.exports = mongoose.model('User', userSchema);
