const braintree = require('braintree');
const Booking = require('../Models/Bookingmodel');
const Payment = require('../Models/Paymentmodel');
require('dotenv').config();

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
            res.json({ clientToken: response.clientToken });
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
            amount: booking.price,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true,
            },
        }, async (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

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

module.exports = { braintreeTokenController, braintreePaymentController };
