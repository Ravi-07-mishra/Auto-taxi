const express = require('express');
const router = express.Router();

const { sendMessage, getMessages } = require('../controllers/Chat');

router.route('/send').post(sendMessage);
router.route('/:bookingId').get(getMessages);

module.exports = router;