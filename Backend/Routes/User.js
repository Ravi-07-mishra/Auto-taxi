const express = require('express');
const router = express.Router();
const upload = require('../utiils/userupload'); // Changed to 'upload' instead of 'userupload'
const User = require('../Models/Usermodel');
const passport = require('passport');

const { Usersignup, userlogin, verifyUser,updateProfile,
  uploadProfileImage,
  getUserProfile, 
  logoutUser} = require('../controllers/User');
const otpController = require('../controllers/otpController');
const { DoBooking, getallUserBookings, Review, GetCompletedBookings } = require('../controllers/Booking');
const { verifyToken } = require('../utiils/token-manager');
const path = require('path')
router.route('/usersignup').post(Usersignup);
router.route('/userlogin').post(userlogin);
router.route('/send-otp').post(otpController.sendOTP);
router.route('/booking').post(DoBooking);
router.route('/auth-status').get(verifyToken, verifyUser);
router.route('/:userId').get(getallUserBookings);
router.route('/completedBookings/:userId').get(GetCompletedBookings);
router.route('/rating/:bookingId').post(Review);
router.route('/logout').post(logoutUser)
router.put('/updateProfile', verifyToken, updateProfile);
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Create token after successful authentication
    const token = createToken(
      req.user._id.toString(),
      req.user.email,
      "7d"
    );
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(COOKIE_NAME, token, {
      path: "/",
      domain: "localhost",
      expires,
      httpOnly: true,
      signed: true,
    });

    res.redirect('/userhome');
  }
);


// Upload profile image
router.post(
  '/uploadProfileImage',
  verifyToken,
  upload.single('profileImage'),
  uploadProfileImage
);

// Get user profile
router.get('/profile', verifyToken, getUserProfile);

module.exports = router;
