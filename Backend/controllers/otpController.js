const otpGenerator = require('otp-generator');
const OTP = require('../Models/otpModel');
const User = require('../Models/Usermodel');
const sendOtpEmail = require('../utiils/mailer');

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(401).json({
        message: 'User is already registered with us',
      });
    }

    // Generate OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Check if OTP already exists
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    // Save OTP to DB
    const otpPayload = { email, otp };
    await OTP.create(otpPayload);

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendOTP };
