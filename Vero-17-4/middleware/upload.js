'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure destination folder exists
const uploadPath = path.join(__dirname, '../public/uploads/products');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Set up storage logic
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create the multer instance
// Not limiting fileSize per file here as requested, to allow validation of total size in controller
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
