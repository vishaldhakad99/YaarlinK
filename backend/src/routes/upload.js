const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Convert to base64 data URL for demo (use Cloudinary in production)
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // In production: upload to Cloudinary
    // const result = await cloudinary.uploader.upload(base64, { folder: 'yaarlink/avatars' });
    // const url = result.secure_url;

    const url = base64; // Demo fallback

    await User.findByIdAndUpdate(req.user._id, {
      avatar: url,
      $addToSet: { photos: url },
      $set: { 'verified.photo': false }
    });

    res.json({ url, message: 'Avatar uploaded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload photo
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const user = await User.findById(req.user._id);
    if (user.photos.length >= 6) return res.status(400).json({ error: 'Max 6 photos allowed' });

    user.photos.push(base64);
    await user.save();

    res.json({ url: base64, photos: user.photos });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
