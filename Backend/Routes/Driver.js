const express = require('express');
const router = express.Router();
const upload = require('../utiils/upload');
const fs = require("fs");
const path = require('path');
const Driver = require('../Models/drivermodel')
const {Register,GetallDrivers,Login, updateAvailability, verifyDriver, GetSubscriptionStatus, Logout} = require('../controllers/driver');
const { getallDriverBookings, getBooking, CompleteBooking } = require('../controllers/Booking');
const { verifyDriverToken } = require('../utiils/token-manager');
const BASE_UPLOAD_PATH = "D:/PROJECT/Auto-taxi/Backend/uploads/drivers";

router.post('/register', upload.single('licenseDoc'), Register);
router.post('/login', upload.single('licenseDoc'), Login);
router.route('/availability').put(updateAvailability)
router.get('/',GetallDrivers);
router.route('/auth-status').get(verifyDriverToken,verifyDriver)
router.route('/driver/:bookingId').get(getBooking);
router.get('/:driverId',getallDriverBookings);
router.route('/subscription/:driverId').get(GetSubscriptionStatus)
router.route('/logout').post(Logout)
router.post(
  '/uploadProfileImage/:driverId',
  verifyDriverToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const driverId = req.params.driverId;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Determine the type of image (profile/cover)
      const fileType = req.body.type || 'profile'; // Default to 'profile' if not provided

      // Create the relative file path based on the file type
      const filePath = path.join("uploads", "drivers", fileType, req.file.filename);

      // Find the driver and update the image field
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      // Update the driver's image based on the type
      if (fileType === 'profile') {
        driver.profileImage = filePath;
      } else if (fileType === 'cover') {
        driver.coverImage = filePath;
      }

      await driver.save();

      res.json({
        message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} image uploaded successfully!`,
        imageUrl: `/uploads/drivers/${fileType}/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ message: "Failed to update image." });
    }
  }
);


// Add a route to get the driver's profile
router.get(`/profile/:driverId`, verifyDriverToken, async (req, res) => {
 
  const driverId = req.params.driverId;
  try {
    const driver = await Driver.findById(driverId)
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" })
    }

    res.json({
      data: {
        driver: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          avgRating: driver.avgRating,
          profileImage: driver.profileImage,
          // Add any other fields you want to send to the frontend
        },
      },
    })
  } catch (error) {
    console.error("Error fetching driver profile:", error)
    res.status(500).json({ message: "Failed to fetch driver profile." })
  }
})

router.route('/end/:bookingId').patch(CompleteBooking)
router.put('/updateProfileImage', verifyDriverToken, async (req, res) => {
  const { driverId, profileImage } = req.body; // Get driverId and profileImage from the request body

  if (!driverId || driverId !== req.driver._id.toString()) {
    return res.status(403).json({ message: 'Unauthorized: Invalid driver ID.' });
  }

  if (!profileImage) {
    return res.status(400).json({ message: 'Profile image is required.' });
  }

  try {
    const driver = await Driver.findByIdAndUpdate(driverId, { profileImage });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    res.json({ message: 'Profile image updated successfully!' });
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).send("Failed to update profile image.");
  }
});

  // Route to upload cover image
  router.post('/uploadCoverImage',verifyDriver, upload.single('coverImage'), (req, res) => {
    if (req.file) {
      res.json({
        message: 'Cover image uploaded successfully!',
        filePath: req.file.path,  // Path of uploaded cover image
      });
    } else {
      res.status(400).send('Please upload a valid image.');
    }
  });
  
module.exports = router;