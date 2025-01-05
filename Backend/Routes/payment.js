const express = require('express');
const router = express.Router();
const { braintreeTokenController, braintreePaymentController } = require('../controllers/PaymentController');

router.route('/braintree/token').get(braintreeTokenController);

router.route('/braintree/payment').post(braintreePaymentController);

module.exports  = router

