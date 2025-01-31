const express = require('express');
const router = express.Router();

const { sendMessage, getMessages, GetallConversations } = require('../controllers/Chat');

router.route('/send').post(sendMessage);
router.route('/:bookingId').get(getMessages);
router.route('/driver/conversations/:driverId').get(GetallConversations);
module.exports = router;