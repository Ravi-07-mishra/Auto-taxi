const braintree = require('braintree');
const Booking = require('../Models/Bookingmodel');
const Payment = require('../Models/Paymentmodel');
require('dotenv').config();
const subscriptionPlans = require('../SubscriptionPlan');
const Subscriptionmodel = require('../Models/Subscriptionmodel');
const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

const braintreeTokenController = async (req, res) => {
    try {
        gateway.clientToken.generate({}, (err, response) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ clientToken: response.clientToken });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const braintreePaymentController = async (req, res) => {
    try {
        const { nonce, bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        gateway.transaction.sale({
            amount: req.body.amount,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true,
            },
        }, async (err, result) => {
            if (err) {
                console.error("Transaction error:", err);
                return res.status(500).json({ error: err.message });
            }
            console.log("Transaction result:", result);
            if (result.success) {
                const payment = new Payment({
                    user: booking.user,
                    payment: result,
                    driver: booking.driver,
                });

                await payment.save();
                res.json({ success: true, result });
            } else {
                res.status(500).json({ error: 'Payment failed', details: result });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const ShowSubscriptionPlans  = async(req,res)=>{
try {
    res.status(200).json({plans: subscriptionPlans})
} catch (error) {
    res.status(500).send({ message: "Failed to fetch plans." });  
}
}
const Subscription = async (req, res) => {
    const { paymentMethodNonce, planId, driverId } = req.body;
  
    if (!paymentMethodNonce || !planId || !driverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      // Step 1: Create a customer in Braintree
      const customerResult = await gateway.customer.create({
        paymentMethodNonce,
      });
  
      if (!customerResult.success) {
        return res.status(500).json({ error: "Failed to create customer" });
      }
  
      const paymentMethodToken = customerResult.customer.paymentMethods[0].token;
  
      // Step 2: Create a subscription
      const subscriptionResult = await gateway.subscription.create({
        paymentMethodToken,
        planId,
      });
  
      if (!subscriptionResult.success) {
        return res.status(500).json({ error: "Failed to create subscription" });
      }
  
      // Step 3: Save subscription data to the database
      const subscriptionData = {
        driver_id: driverId,
        braintree_subscription_id: subscriptionResult.subscription.id,
        plan_id: planId,
        subscription_start_date: new Date(subscriptionResult.subscription.billingPeriodStartDate),
        subscription_end_date: new Date(subscriptionResult.subscription.billingPeriodEndDate),
        status: "active",
      };
  
      const newSubscription = new Subscriptionmodel(subscriptionData);
      await newSubscription.save();
  
      res.json({
        success: true,
        message: "Subscription created successfully",
        subscription: newSubscription,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred during subscription" });
    }
  };
module.exports = { braintreeTokenController, braintreePaymentController , ShowSubscriptionPlans,Subscription};
