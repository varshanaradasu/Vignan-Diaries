const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: process.env.CLOUDINARY_FOLDER || 'blogging-mern',
    resource_type: 'auto',
    public_id: `${Date.now()}-${(file.originalname || 'upload').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')}`,
  }),
});

module.exports = { cloudinary, cloudinaryStorage };
