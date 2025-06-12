// controllers/driverController.js
const mongoose = require("mongoose");
const Driver = require("../Models/drivermodel");
const validDrivers = require("../data");
const bcrypt = require("bcryptjs");
const Booking = require("../Models/Bookingmodel");
const { createToken } = require('../utiils/token-manager')
const { DRIVER_COOKIE_NAME } = require("../utiils/constants");
const Subscriptionmodel = require("../Models/Subscriptionmodel");

// Determine cookie domain at runtime
const COOKIE_DOMAIN =
  process.env.NODE_ENV === "production"
    ? "auto-taxi-1.onrender.com"
    : "localhost";

const COOKIE_OPTS_COMMON = {
  path: "/",
  domain: COOKIE_DOMAIN,
  httpOnly: true,
  signed: true,
  secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
  sameSite: "none",                              // allow cross-site
};

const Register = async (req, res) => {
  try {
    const {
      name,
      email,
      aadhaar_number,
      driving_license_number,
      vehicle_license_number,
      date_of_birth,
      password,
      licenseDoc,
      lat,
      lng,
    } = req.body;

    if (
      !name ||
      !email ||
      !aadhaar_number ||
      !driving_license_number ||
      !vehicle_license_number ||
      !date_of_birth ||
      !password ||
      !lat ||
      !lng
    ) {
      return res
        .status(400)
        .json({ msg: "All fields must be filled out." });
    }

    const isValidDriver = validDrivers.some((driver) =>
      driver.name === name &&
      driver.aadhaar_number === aadhaar_number &&
      driver.driving_license_number === driving_license_number &&
      driver.vehicle_license_number === vehicle_license_number &&
      new Date(driver.date_of_birth).toISOString().split("T")[0] ===
        new Date(date_of_birth).toISOString().split("T")[0]
    );

    if (!isValidDriver) {
      return res
        .status(400)
        .json({ msg: "Invalid or mismatched driver details." });
    }

    const existingDriverByEmail = await Driver.findOne({ email });
    if (existingDriverByEmail) {
      return res
        .status(400)
        .json({ msg: "Driver with this email is already registered." });
    }

    const existingDriverByAadhaar = await Driver.findOne({ aadhaar_number });
    if (existingDriverByAadhaar) {
      return res
        .status(400)
        .json({ msg: "Driver with this Aadhaar number is already registered." });
    }

    const existingDriverByLicense = await Driver.findOne({
      driving_license_number,
    });
    if (existingDriverByLicense) {
      return res.status(400).json({
        msg: "Driver with this Driving License number is already registered.",
      });
    }

    const existingDriverByVehicleLicense = await Driver.findOne({
      vehicle_license_number,
    });
    if (existingDriverByVehicleLicense) {
      return res.status(400).json({
        msg: "Driver with this Vehicle License number is already registered.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    let licenseDocPath = "";
    if (licenseDoc) {
      licenseDocPath = `/uploads/${licenseDoc.name}`;
    }

    const newDriver = await Driver.create({
      name,
      email,
      password: hash,
      aadhaar_number,
      driving_license_number,
      vehicle_license_number,
      date_of_birth,
      licenseDocPath,
      location: { lat, lng },
    });

    // Clear existing driver cookie if present
    if (req.signedCookies[DRIVER_COOKIE_NAME]) {
      res.clearCookie(DRIVER_COOKIE_NAME, {
        path: "/",
        domain: COOKIE_DOMAIN,
        signed: true,
      });
    }

    const token = createToken(newDriver._id.toString(), newDriver.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(DRIVER_COOKIE_NAME, token, {
      ...COOKIE_OPTS_COMMON,
      expires,
    });

    res.status(201).json({
      msg: "Driver registered successfully.",
      driver: newDriver,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ msg: "Error registering driver. Please try again later.", error: error.message });
  }
};

const GetallDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({});
    res.status(200).json({ drivers });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Please fill all the fields" });
    }

    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Incorrect Password" });
    }

    // Clear existing driver cookie if present
    if (req.signedCookies[DRIVER_COOKIE_NAME]) {
      res.clearCookie(DRIVER_COOKIE_NAME, {
        path: "/",
        domain: COOKIE_DOMAIN,
        signed: true,
      });
    }

    const token = createToken(driver._id.toString(), driver.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(DRIVER_COOKIE_NAME, token, {
      ...COOKIE_OPTS_COMMON,
      expires,
    });

    res.status(201).json({
      msg: "Login successful",
      driver,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

const GetAllBookingRequests = async (req, res) => {
  try {
    const { driver_id } = req.body;
    const driver = await Driver.findById(driver_id);
    if (!driver) {
      return res.status(404).json({ msg: "Invalid Driver ID" });
    }
    const requests = await Booking.find({ driver: driver_id });
    res.status(200).json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const verifyDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(res.locals.jwtDriverData.id);
    if (!driver) {
      return res
        .status(401)
        .send("Driver not registered or token is wrong");
    }
    if (driver._id.toString() !== res.locals.jwtDriverData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    return res.status(200).json({
      message: "Successful login",
      driver,
    });
  } catch (error) {
    return res.status(500).json({
      message: "ERROR",
      cause: error.message,
    });
  }
};

const updateAvailability = async (req, res) => {
  const { driverId, isAvailable } = req.body;
  try {
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { isAvailable },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ msg: "Driver not found" });
    }
    res.status(200).json({ msg: "Driver availability updated", driver });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const GetSubscriptionStatus = async (req, res) => {
  const { driverId } = req.params;
  try {
    const latestSubscription = await Subscriptionmodel.findOne({
      driver_id: driverId,
    })
      .sort({ subscription_end_date: -1 })
      .limit(1);

    if (!latestSubscription) {
      return res.status(404).json({
        message: "No subscription history found for this driver ID",
      });
    }

    if (latestSubscription.status === "active") {
      return res.status(200).json({
        isSubscribed: true,
        planId: latestSubscription.plan_id,
        expiryDate: latestSubscription.subscription_end_date,
        status: "active",
      });
    }

    return res.status(200).json({
      isSubscribed: false,
      planId: latestSubscription.plan_id,
      expiryDate: latestSubscription.subscription_end_date,
      status: latestSubscription.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Logout = async (req, res) => {
  try {
    if (req.signedCookies[DRIVER_COOKIE_NAME]) {
 res.clearCookie(DRIVER_COOKIE_NAME, {
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
    res.status(500).json({ msg: "Error logging out" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const driverId = req.driver._id; // Extracted from verified token
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ msg: "Driver not found." });
    }
    if (name) driver.name = name;
    if (email) driver.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      driver.password = await bcrypt.hash(password, salt);
    }
    await driver.save();
    res.status(200).json({
      msg: "Profile updated successfully.",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        profileImage: driver.profileImage,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

const getTopRatedDrivers = async (req, res) => {
  console.log("Received request at:", new Date());
  try {
    const topDrivers = await Driver.find({})
      .sort({ avgRating: -1, numRatings: -1 })
      .limit(5)
      .select("name avgRating numRatings profileImage")
      .lean();
    console.log(
      "Found drivers:",
      topDrivers.map((d) => ({
        name: d.name,
        rating: d.avgRating,
        ratingsCount: d.numRatings,
      }))
    );
    res.status(200).json({
      success: true,
      data: topDrivers,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = {
  Register,
  GetallDrivers,
  Login,
  GetAllBookingRequests,
  updateAvailability,
  verifyDriver,
  GetSubscriptionStatus,
  Logout,
  updateProfile,
  getTopRatedDrivers,
};
