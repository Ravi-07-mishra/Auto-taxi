const mongoose = require('mongoose');
const Driver = require('../Models/drivermodel');
const validDrivers = require('../data');
const bcrypt = require('bcryptjs');
const Booking = require('../Models/Bookingmodel');

// Registration Controller for Driver
const Register = async (req, res) => {
    try {
        // Destructure the fields from the request body
        const { name, email, aadhaar_number, driving_license_number, vehicle_license_number, date_of_birth, password, licenseDoc, lat, lng } = req.body;

        // Validate the required fields
        if (!name || !email || !aadhaar_number || !driving_license_number || !vehicle_license_number || !date_of_birth || !password || !lat || !lng) {
            return res.status(400).json({ msg: "All fields must be filled out." });
        }

        // Check if the Aadhaar, License, and Vehicle License match the same person in the valid driver list
        const isValidDriver = validDrivers.some(driver => 
            driver.name === name &&
            driver.aadhaar_number === aadhaar_number &&
            driver.driving_license_number === driving_license_number &&
            driver.vehicle_license_number === vehicle_license_number &&
            new Date(driver.date_of_birth).toISOString().split('T')[0] === new Date(date_of_birth).toISOString().split('T')[0]
        );

        if (!isValidDriver) {
            return res.status(400).json({ msg: 'Invalid or mismatched driver details.' });
        }

        // Check if the driver already exists in the database
        const existingDriverByEmail = await Driver.findOne({ email });
        if (existingDriverByEmail) {
            return res.status(400).json({ msg: 'Driver with this email is already registered.' });
        }

        const existingDriverByAadhaar = await Driver.findOne({ aadhaar_number });
        if (existingDriverByAadhaar) {
            return res.status(400).json({ msg: 'Driver with this Aadhaar number is already registered.' });
        }

        const existingDriverByLicense = await Driver.findOne({ driving_license_number });
        if (existingDriverByLicense) {
            return res.status(400).json({ msg: 'Driver with this Driving License number is already registered.' });
        }

        const existingDriverByVehicleLicense = await Driver.findOne({ vehicle_license_number });
        if (existingDriverByVehicleLicense) {
            return res.status(400).json({ msg: 'Driver with this Vehicle License number is already registered.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Handle license document upload if required
        let licenseDocPath = "";
        if (licenseDoc) {
            // Assuming the file is being uploaded via a form, you'd handle it like this:
            licenseDocPath = `/uploads/${licenseDoc.name}`;  // Path where the file will be saved
        }

        // Create a new driver with the provided details, including location (lat, lng)
        const newDriver = await Driver.create({
            name,
            email,
            password: hash,
            aadhaar_number,
            driving_license_number,
            vehicle_license_number,
            date_of_birth,
            licenseDocPath,
            location: { lat, lng }, // Save the location here
        });

        // Send a success response with the created driver details
        res.status(201).json({
            msg: 'Driver registered successfully.',
            driver: newDriver
        });

    } catch (error) {
        // Catch and handle errors
        console.error(error); // Log error for debugging
        res.status(500).json({ msg: 'Error registering driver. Please try again later.', error: error.message });
    }
};

const GetallDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({});
        res.status(200).json({
            drivers
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please fill all the fields' });
        }

        // Check if the user exists
        const driver = await Driver.findOne({ email });
        if (!driver) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Incorrect Password' });
        }

        // Successful login
        res.status(200).json({
            msg: 'Login successful',
            user: { id: driver._id, email: driver.email }, // Send user info as needed
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
};

const GetAllBookingRequests = async (req, res) => {
    try {
      const { driver_id } = req.body;
      const driver = await Driver.findById(driver_id);
  
      if (!driver) {
        return res.status(404).json({ msg: 'Invalid Driver ID' });
      }
  
      const requests = await Booking.find({ driver: driver_id });
      res.status(200).json({ requests });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
  const updateAvailability = async (req, res) => { const { driverId, isAvailable } = req.body; try { const driver = await Driver.findByIdAndUpdate(driverId, { isAvailable }, { new: true }); if (!driver) { return res.status(404).json({ msg: 'Driver not found' }); } res.status(200).json({ msg: 'Driver availability updated', driver }); } catch (error) { console.error('Error updating availability:', error); res.status(500).json({ msg: 'Server error' }); } };
module.exports = { Register, GetallDrivers, Login, GetAllBookingRequests,updateAvailability };