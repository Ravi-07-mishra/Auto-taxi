const express = require('express');
const router = express.Router();

const {Usersignup,userlogin} = require('../controllers/User')
const otpController = require('../controllers/otpController')
const {DoBooking, getallUserBookings} = require('../controllers/Booking');
router.route('/usersignup').post(Usersignup);
router.route('/userlogin').post(userlogin);
router.route('/send-otp').post(otpController.sendOTP)
router.route('/booking').post(DoBooking);
router.route('/:userId').get(getallUserBookings);
module.exports = router