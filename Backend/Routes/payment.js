const express = require('express');
const router = express.Router();
const { braintreeTokenController, braintreePaymentController, ShowSubscriptionPlans, Subscription } = require('../controllers/PaymentController');

router.route('/braintree/token').get(braintreeTokenController);

router.route('/braintree/pay').post(braintreePaymentController);
router.route('/plans').get(ShowSubscriptionPlans)
router.route('/braintree/subscribe').post(Subscription)
module.exports  = router

