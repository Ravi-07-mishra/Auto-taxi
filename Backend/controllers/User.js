const User = require('../Models/Usermodel')
const otpGenerator = require('otp-generator');
const sendOtpEmail = require('../utiils/mailer');
const OTP = require('../Models/otpModel')
const otpController = require('./otpController')
const bcrypt = require('bcryptjs')
const Usersignup = async (req, res) => {
    const { name, email, password ,otp} = req.body;

    try {
        if (!email || !name || !password || !otp) {
            return res.status(400).json({ error: 'All fields are required' });
          }
          

        const exist = await User.findOne({ email });

        if (exist) {
            return res.status(400).json({
                error: `${email} already registered.`
            });
        }

      const response = await OTP.find({email}).sort({createdAt: -1}).limit(1);
      if(response.length === 0 || otp !== response[0].otp){
        return res.status(400).json({
            success: false,
            error: 'The OTP is not valid',
        })
      }
      
      
        const salt = await bcrypt.genSalt(10);
 const hash = await bcrypt.hash(password,salt);
 const newUser = await User.create({
    name,email,password:hash,
 });
 return res.status(201).json({
    sucess: true,
    msg: 'User registered successfully',
    user: newUser,
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

      // Successful login
      res.status(200).json({
          msg: 'Login successful',
          user: { id: user._id, email: user.email }, // Send user info as needed
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Server error. Please try again later.' });
  }
};



module.exports = {Usersignup,userlogin};