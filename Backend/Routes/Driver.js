const express = require('express');
const router = express.Router();
const upload = require('../utiils/upload');

const {Register,GetallDrivers,Login, updateAvailability} = require('../controllers/driver');
const { getallDriverBookings } = require('../controllers/Booking');

router.post('/register', upload.single('licenseDoc'), Register);
router.post('/login', upload.single('licenseDoc'), Login);
router.route('/availability').put(updateAvailability)
router.get('/',GetallDrivers);
router.get('/:driverId',getallDriverBookings);



module.exports = router;