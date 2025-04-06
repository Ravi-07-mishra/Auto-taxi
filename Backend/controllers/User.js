const User = require('../Models/Usermodel')
const otpGenerator = require('otp-generator');
const sendOtpEmail = require('../utiils/mailer');
const OTP = require('../Models/otpModel');
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
       
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please fill all the fields' });
        }
  
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'This email is not registered with us' });
        }
  
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
  
       
        return res.status(201).json({
            msg: 'Login successful',
            user: user, 
            token: token,  
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

        
        return res.status(200).json({
            success: true,
            message: "User authenticated successfully",
            user: user, 
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred while verifying user",
            cause: error.message,
        });
    }
};
const updateProfile = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const userId = req.user._id; // Assuming user ID is extracted from the token
  
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found.' });
      }
  
      // Update fields if provided
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({
        msg: 'Profile updated successfully.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
  };
  
  // Upload profile image
  const uploadProfileImage = async (req, res) => {
    router.post(
  '/uploadProfileImage/:driverId',
  verifyDriverToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const driverId = req.params.driverId;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Determine the type of image (profile/cover)
      const fileType = req.body.type || 'profile'; // Default to 'profile' if not provided

      // Create the relative file path based on the file type
      const filePath = path.join("uploads", "drivers", fileType, req.file.filename);

      // Find the driver and update the image field
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      // Update the driver's image based on the type
      if (fileType === 'profile') {
        driver.profileImage = filePath;
      } else if (fileType === 'cover') {
        driver.coverImage = filePath;
      }

      await driver.save();

      res.json({
        message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} image uploaded successfully!`,
        imageUrl: `/uploads/drivers/${fileType}/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ message: "Failed to update image." });
    }
  }
);
  };
  
  // Get user profile
  const getUserProfile = async (req, res) => {
    try {
      const userId = req.user._id; // Assuming user ID is extracted from the token
  
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'User not found.' });
      }
  
      res.status(200).json({
        msg: 'User profile fetched successfully.',
        user,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
  };
  const logoutUser = async(req,res)=>{
    try {
      // Check if the signed cookie exists
      if (req.signedCookies[COOKIE_NAME]) {
        // Clear the cookie
        res.clearCookie(COOKIE_NAME, {
          path: '/',   // Ensure the path matches where the cookie is set
          httpOnly: true,
          signed: true,
        });
      }
      res.status(200).send('Logged out');
    } catch (error) {
      console.error(error);
      res.status(500).json({
        msg: 'Error logging out',
      });
    }
  }


module.exports = {Usersignup,userlogin,verifyUser, updateProfile,
    uploadProfileImage,
    getUserProfile,logoutUser};