const express = require('express');
const router = express.Router();
const upload = require('../utiils/userupload');
const User = require('../Models/Usermodel');
const passport = require('passport');
const path = require('path');
const { Usersignup, userlogin, verifyUser, updateProfile,
  uploadProfileImage,
  getUserProfile, 
  logoutUser } = require('../controllers/User');
const otpController = require('../controllers/otpController');
const { DoBooking, getallUserBookings, Review, GetCompletedBookings, getBooking } = require('../controllers/Booking');
const { verifyToken } = require('../utiils/token-manager');
const { createToken } = require('../utiils/token-manager');
const { COOKIE_NAME } = require('../utiils/constants');
router.route('/driver/:bookingId').get(getBooking);

router.route('/usersignup').post(Usersignup);
router.route('/userlogin').post(userlogin);
router.route('/tryingtodoit/:bookingId').get(getBooking);

router.route('/completedBookings/:userId').get(GetCompletedBookings);
// router.route('/completedBookings/:userId').get(GetCompletedBookings);


router.route('/send-otp').post(otpController.sendOTP);
router.route('/booking').post(DoBooking);
router.route('/auth-status').get(verifyToken, verifyUser);
router.route('/:userId').get(getallUserBookings);
// router.route('/completedBookings/:userId').get(GetCompletedBookings);
router.route('/rating/:bookingId').post(Review);
router.route('/logout').post(logoutUser);
router.post(
  '/uploadProfileImage/:userId',
  verifyToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Determine the type of image (profile/cover)
      const fileType = req.body.type || 'profile';

      // Create the relative file path based on the file type
      const filePath = path.join("uploads", "users", fileType, req.file.filename);

      // Find the user and update the image field
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (fileType === 'profile') {
        user.profileImage = filePath;
      } else if (fileType === 'cover') {
        user.coverImage = filePath;
      }

      await user.save();

      res.json({
        message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} image uploaded successfully!`,
        imageUrl: `/uploads/users/${fileType}/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ message: "Failed to update image." });
    }
  }
);
// Initiate Google OAuth authentication without session support
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Google OAuth callback route (JWT is created here, no sessions used)
const CLIENT_URL = process.env.CLIENT_URL;       // https://auto-taxi-rh6i.vercel.app
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN; // auto-taxi-rh6i.vercel.app

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    // Issue JWT
    const token = createToken(req.user._id.toString(), req.user.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // Set cookie explicitly
    res.cookie(COOKIE_NAME, token, {
      path: "/",
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      expires,
    });

    // Redirect into your frontend
    res.redirect(`${CLIENT_URL}/userhome`);
  }
);

// Upload profile image

router.get(`/profile/:userId`, verifyToken, async (req, res) => {
 
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        
          profileImage: user.profileImage,
          // Add any other fields you want to send to the frontend
        },
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ message: "Failed to fetch user profile." })
  }
})
router.put("/updateProfile", verifyToken, async (req, res) => {
  // Assume that verifyToken attaches the authenticated user to req.user
  const userId = req.user._id;
  const { name, email, currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (name) user.name = name;
    if (email) user.email = email;

    // If a new password is provided, check for the current password and verify it
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password." });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage, // Ensure this field exists on your user document
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error while updating profile." });
  }
});

module.exports = router;
