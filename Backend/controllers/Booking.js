const Booking = require("../Models/Bookingmodel");
const Driver = require("../Models/drivermodel");
const { calculateDistance } = require("../utiils/Calculatedistance");

const DoBooking = async (req, res) => {
  let responseSent = false; // Ensure responseSent is declared upfront

  try {
    const { userId, pickupLocation, destinationLocation } = req.body;

    // Validate inputs
    const validateLocation = (location) =>
      location && typeof location.lat === "number" && typeof location.lng === "number";

    if (!userId || !validateLocation(pickupLocation) || !validateLocation(destinationLocation)) {
      return res.status(400).json({ msg: "All fields are required and must be valid." });
    }

    // Fetch available drivers
    const drivers = await Driver.find({ isAvailable: true });
    if (drivers.length === 0) {
      return res.status(404).json({ msg: "No drivers available at the moment." });
    }
console.log(drivers);
    // Sort drivers by distance
    const driversWithDistance = drivers
      .filter((driver) => driver.location?.lat && driver.location?.lng)
      .map((driver) => ({
        driver,
        distance: calculateDistance(pickupLocation, driver.location),
      }));
      console.log('driversWithDistance:', driversWithDistance);

    driversWithDistance.sort((a, b) => a.distance - b.distance);

    // Try booking with drivers one by one
    for (const { driver } of driversWithDistance) {
      console.log(`Trying to book driver: ${driver.name} (${driver.socketId})`);

      // Create a booking record
      const booking = await Booking.create({
        user: userId,
        pickupLocation,
        destinationLocation,
        driver: driver._id,
      });
      console.log(`Driver details:`, driver);
      console.log(`Driver's socketId:`, driver.socketId);
      
    
      if (driver.socketId && global.io) {
        global.io.to(driver.socketId).emit("BookingRequest", {
          bookingId: booking._id,
          pickupLocation,
          destinationLocation,
          driverId: driver._id,
        });
        console.log(`Booking request sent to driver ${driver.name} (${driver.socketId})`);
      } else {
        console.log(`Driver ${driver.name} does not have a socketId, or global.io is undefined. Skipping booking request.`);
      }
      

      // Wait for driver's response within 5 minutes
      const isAccepted = await new Promise((resolve) => {
        setTimeout(async () => {
          const updatedBooking = await Booking.findById(booking._id);
          resolve(updatedBooking.isAccepted || false);
        }, 5 * 60 * 1000); // 5 minutes
      });

      if (isAccepted) {
        if (!responseSent) {
          responseSent = true;
          return res.status(200).json({
            success: true,
            msg: `Booking accepted by driver ${driver.name}.`,
            bookingId: booking._id,
          });
        }
        break; // Stop trying other drivers if booking is accepted
      } else {
        console.log(`Driver ${driver.name} did not respond. Trying next driver...`);
        await Booking.findByIdAndDelete(booking._id); // Cleanup booking if not accepted
      }
    }

    if (!responseSent) {
      responseSent = true;
      res.status(404).json({ msg: "No drivers responded to the booking request." });
    }
  } catch (error) {
    console.error("Booking error:", error);
    if (!responseSent) {
      res.status(500).json({ msg: "Error creating booking", error: error.message });
    }
  }
};

const mongoose = require('mongoose');

const getallUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('User ID from request:', userId);  // Log the userId
    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('Converted ObjectId:', userObjectId);  // Log the ObjectId
    // Query bookings with the converted ObjectId
    const bookings = await Booking.find({ user: userObjectId, status: 'Accepted' });

    if (!bookings || bookings.length === 0) {
      return res.status(400).json({
        msg: 'No booking requests accepted at the moment',
      });
    }

    res.status(200).json({
      bookings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: 'An error occurred while retrieving bookings',
    });
  }
};

const getallDriverBookings = async(req,res)=>{
  try {
    const { driverId } = req.params;
    console.log('driver ID from request:', driverId);  // Log the userId
    // Convert userId to ObjectId
    const driverObjectId = new mongoose.Types.ObjectId(driverId);
    console.log('Converted ObjectId:', driverObjectId);  // Log the ObjectId
    // Query bookings with the converted ObjectId
    const bookings = await Booking.find({ driver: driverObjectId, status: 'Accepted' });

    if (!bookings || bookings.length === 0) {
      return res.status(400).json({
        msg: 'No booking requests accepted at the moment',
      });
    }

    res.status(200).json({
      bookings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: 'An error occurred while retrieving bookings',
    });
  }
}


module.exports = { DoBooking,getallDriverBookings,getallUserBookings };
