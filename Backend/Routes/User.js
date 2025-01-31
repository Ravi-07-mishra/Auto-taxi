const express = require('express');
const router = express.Router();
const upload = require('../utiils/upload');
const {Usersignup,userlogin, verifyUser} = require('../controllers/User')
const otpController = require('../controllers/otpController')
const {DoBooking, getallUserBookings, Review, GetCompletedBookings} = require('../controllers/Booking');
const { verifyToken } = require('../utiils/token-manager');
router.route('/usersignup').post(Usersignup);
router.route('/userlogin').post(userlogin);
router.route('/send-otp').post(otpController.sendOTP)
router.route('/booking').post(DoBooking);
router.route('/auth-status').get(verifyToken,verifyUser)
router.route('/:userId').get(getallUserBookings);
router.route('/completedBookings/:userId').get(GetCompletedBookings);
router.route('/rating/:bookingId').post(Review)
router.post('/uploadProfileImage', upload.single('profileImage'), (req, res) => {
    if (req.file) {
      res.json({
        message: 'Profile image uploaded successfully!',
        filePath: req.file.path,  // Path of uploaded profile image
      });
    } else {
      res.status(400).send('Please upload a valid image.');
    }
  });
  
  // Route to upload cover image
  router.post('/uploadCoverImage', upload.single('coverImage'), (req, res) => {
    if (req.file) {
      res.json({
        message: 'Cover image uploaded successfully!',
        filePath: req.file.path,  // Path of uploaded cover image
      });
    } else {
      res.status(400).send('Please upload a valid image.');
    }
  });
module.exports = router