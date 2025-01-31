const express = require('express');
const { GetallNotifications, MarkRead } = require('../controllers/Notifcation');
const router = express.Router();

router.route('/:userId').get(GetallNotifications);
router.route('/:id').patch(MarkRead);

module.exports  = router
