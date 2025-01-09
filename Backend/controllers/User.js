const User = require('../Models/Usermodel')
const otpGenerator = require('otp-generator');
const sendOtpEmail = require('../utiils/mailer');
const OTP = require('../Models/otpModel')
const otpController = require('./otpController')
const bcrypt = require('bcryptjs');
const { createToken } = require('../utiils/token-manager');
const { COOKIE_NAME } = require('../utiils/constants');


const Usersignup = async (req, res) => {
    const { name, email, password, otp } = req.body;
    console.log('Request received:', req.body);

    try {
        if (!email || !name || !password || !otp) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(400).json({ error: `${email} already registered.` });
        }

        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        if (response.length === 0 || otp !== response[0].otp) {
            return res.status(400).json({ success: false, error: 'The OTP is not valid' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const newUser = await User.create({ name, email, password: hash });

        if (req.signedCookies[COOKIE_NAME]) {
            res.clearCookie(COOKIE_NAME, { path: "/", domain: "localhost", httpOnly: true, signed: true });
        }
        
        const token = createToken(newUser._id.toString(), newUser.email, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        res.cookie(COOKIE_NAME, token, { path: "/", domain: "localhost", expires, httpOnly: true, signed: true });

        return res.status(201).json({
            success: true,
            msg: 'User registered successfully',
            user: newUser,
            token: token,
        });

    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Error during signup' });
    }
};




const userlogin = async (req, res) => {
    const { email, password } = req.body;
  
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please fill all the fields' });
        }
  
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'This email is not registered with us' });
        }
  
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Incorrect Password' });
        }
  
        if (req.signedCookies[COOKIE_NAME]) {
            res.clearCookie(COOKIE_NAME, { path: "/", domain: "localhost", httpOnly: true, signed: true });
        }
        
  
        const token = createToken(user._id.toString(), user.email, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        res.cookie(COOKIE_NAME, token, { path: "/", domain: "localhost", expires, httpOnly: true, signed: true });
  
        // Successful login
        return res.status(201).json({
            msg: 'Login successful',
            user: user,  // Send the entire user object
            token: token,  // You may also include the token for frontend use
        });
  
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
  };
  
  const verifyUser = async (req, res) => {
    try {
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not registered or token is invalid",
            });
        }

        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).json({
                success: false,
                message: "Permissions didn't match",
            });
        }

        console.log(user._id.toString(), res.locals.jwtData.id);

        // Return the user object along with a success message
        return res.status(200).json({
            success: true,
            message: "User authenticated successfully",
            user: user,  // Full user object
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred while verifying user",
            cause: error.message,
        });
    }
};


module.exports = {Usersignup,userlogin,verifyUser};