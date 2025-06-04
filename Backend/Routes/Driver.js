const express = require('express');
const router = express.Router();
const upload = require('../utiils/upload');
const fs = require("fs");
const passport = require('passport')
const path = require('path');
const Driver = require('../Models/drivermodel')
const {Register,GetallDrivers,Login, updateAvailability, verifyDriver, GetSubscriptionStatus, Logout, updateProfile, getTopRatedDrivers} = require('../controllers/driver');
const { getallDriverBookings, getBooking, CompleteBooking } = require('../controllers/Booking');
const { verifyDriverToken } = require('../utiils/token-manager');
const { DRIVER_COOKIE_NAME } = require('../utiils/constants');
const BASE_UPLOAD_PATH = "D:/PROJECT/Auto-taxi/Backend/uploads/drivers";

router.post('/register', upload.single('licenseDoc'), Register);
router.post('/login', upload.single('licenseDoc'), Login);
router.route('/availability').put(updateAvailability)
router.get('/',GetallDrivers);
router.route('/auth-status').get(verifyDriverToken,verifyDriver)

router.route('/driver/:bookingId').get(getBooking);
router.route('/top-rated').get(getTopRatedDrivers);
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
router.get(
  '/auth/google',
  passport.authenticate('driver-google', { scope: ['profile', 'email'], session: false })
);

// Google OAuth callback for drivers (JWT is created here)
router.get(
  '/auth/google/callback',
  passport.authenticate('driver-google', { failureRedirect: '/driver/login', session: false }),
  (req, res) => {
    // Create token after successful authentication
    const token = createToken(
      req.user._id.toString(),
      req.user.email,
      "7d"
    );
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(DRIVER_COOKIE_NAME, token, {
      path: "/",
      domain: "localhost", // adjust as needed in production
      expires,
      httpOnly: true,
      signed: true,
    });
    // Redirect driver to the appropriate frontend page
    res.redirect('http://localhost:5173/driverdashboard');
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

router.put("/updateProfile", verifyDriverToken, async (req, res) => {
  const driverId = req.driver._id; // Provided by verifyDriverToken middleware
  const { name, email, currentPassword, newPassword } = req.body;
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }
    if (name) driver.name = name;
    if (email) driver.email = email;
    
    // If a new password is provided, check for current password and verify it
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password." });
      }
      const isMatch = await bcrypt.compare(currentPassword, driver.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }
      const salt = await bcrypt.genSalt(10);
      driver.password = await bcrypt.hash(newPassword, salt);
    }
    
    await driver.save();
    res.json({
      message: "Profile updated successfully.",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        profileImage: driver.profileImage, // Ensure this field exists on your driver document
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error while updating profile." });
  }
});

module.exports = router;