const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Function to get upload path based on file type (profile, cover)
const getUploadPath = (type) => {
  return path.join(__dirname, 'uploads', 'users', type);
};

// Ensure the directory exists
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Define the storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.type || 'profile'; // Default to 'profile' if not specified in body
    const uploadPath = getUploadPath(fileType);
    ensureDirExists(uploadPath);
    cb(null, uploadPath); // Specify the directory to save the file
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer configuration for file filtering and limits
const userupload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

module.exports = userupload;
