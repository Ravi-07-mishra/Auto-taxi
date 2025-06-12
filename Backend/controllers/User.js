// controllers/userController.js
const User = require("../Models/Usermodel");
const OTP = require("../Models/otpModel");
const bcrypt = require("bcryptjs");
const { createToken } = require("../utiils/token-manager");
const { COOKIE_NAME } = require("../utiils/constants");

const COOKIE_DOMAIN =
  process.env.NODE_ENV === "production"
    ? "auto-taxi-1.onrender.com"
    : "localhost";

const COOKIE_OPTS_COMMON = {
  path: "/",
  domain: COOKIE_DOMAIN,
  httpOnly: true,
  signed: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
};

const Usersignup = async (req, res) => {
  const { name, email, password, otp } = req.body;
  try {
    if (!email || !name || !password || !otp) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const exist = await User.findOne({ email });
    if (exist) {
      return res
        .status(400)
        .json({ error: `${email} already registered.` });
    }
    const latestOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (!latestOtp.length || otp !== latestOtp[0].otp) {
      return res
        .status(400)
        .json({ success: false, error: "The OTP is not valid" });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const newUser = await User.create({ name, email, password: hash });

    // Clear any existing cookie
    if (req.signedCookies[COOKIE_NAME]) {
      res.clearCookie(COOKIE_NAME, {
        path: "/",
        domain: COOKIE_DOMAIN,
        signed: true,
      });
    }

    const token = createToken(newUser._id.toString(), newUser.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(COOKIE_NAME, token, {
      ...COOKIE_OPTS_COMMON,
      expires,
    });

    return res.status(201).json({
      success: true,
      msg: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Error during signup" });
  }
};

const userlogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: "Please fill all the fields" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ msg: "This email is not registered with us" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Incorrect Password" });
    }
    if (req.signedCookies[COOKIE_NAME]) {
      res.clearCookie(COOKIE_NAME, {
        path: "/",
        domain: COOKIE_DOMAIN,
        signed: true,
      });
    }
    const token = createToken(user._id.toString(), user.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(COOKIE_NAME, token, {
      ...COOKIE_OPTS_COMMON,
      expires,
    });

    return res.status(201).json({
      msg: "Login successful",
      user,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: "Server error. Please try again later." });
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
    return res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      user,
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
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    res.status(200).json({
      msg: "Profile updated successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._1d;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    res.status(200).json({
      msg: "User profile fetched successfully.",
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

const logoutUser = async (req, res) => {
  try {
    if (req.signedCookies[COOKIE_NAME]) {
      res.clearCookie(COOKIE_NAME, {
  path: "/",
  domain: COOKIE_DOMAIN,
  signed: true,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
});
    }
    res.status(200).send("Logged out");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error logging out",
    });
  }
};

module.exports = {
  Usersignup,
  userlogin,
  verifyUser,
  updateProfile,
  getUserProfile,
  logoutUser,
};
