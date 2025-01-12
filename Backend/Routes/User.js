const express = require('express');
const router = express.Router();

const {Usersignup,userlogin, verifyUser} = require('../controllers/User')
const otpController = require('../controllers/otpController')
const {DoBooking, getallUserBookings, Review} = require('../controllers/Booking');
const { verifyToken } = require('../utiils/token-manager');
router.route('/usersignup').post(Usersignup);
router.route('/userlogin').post(userlogin);
router.route('/send-otp').post(otpController.sendOTP)
router.route('/booking').post(DoBooking);
router.route('/auth-status').get(verifyToken,verifyUser)
router.route('/:userId').get(getallUserBookings);
router.route('/rating/:bookingId').post(Review)
module.exports = router