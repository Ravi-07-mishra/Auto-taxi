const express = require('express');
const router = express.Router();
const upload = require('../utiils/upload');

const {Register,GetallDrivers,Login, updateAvailability, verifyDriver} = require('../controllers/driver');
const { getallDriverBookings } = require('../controllers/Booking');
const { verifyDriverToken } = require('../utiils/token-manager');

router.post('/register', upload.single('licenseDoc'), Register);
router.post('/login', upload.single('licenseDoc'), Login);
router.route('/availability').put(updateAvailability)
router.get('/',GetallDrivers);
router.route('/auth-status').get(verifyDriverToken,verifyDriver)
router.get('/:driverId',getallDriverBookings);



module.exports = router;