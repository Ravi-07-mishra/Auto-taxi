// controllers/bookingController.js

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require("../Models/Bookingmodel");
const Driver = require("../Models/drivermodel");
const { calculateDistance } = require("../utiils/Calculatedistance");

const RATE_PER_KM = Number(process.env.RATE_PER_KM);

console.log("RATE_PER_KM from env (number):", RATE_PER_KM);

const DoBooking = async (req, res) => {
  let responseSent = false;

  try {
    const { userId, pickupLocation, destinationLocation } = req.body;

    const validateLocation = (location) =>
      location &&
      typeof location.lat === "number" &&
      typeof location.lng === "number";

    if (!userId || !validateLocation(pickupLocation) || !validateLocation(destinationLocation)) {
      return res.status(400).json({ msg: "All fields are required and must be valid." });
    }

    // find all available drivers
    const drivers = await Driver.find({ isAvailable: true });
    if (drivers.length === 0) {
      return res.status(404).json({ msg: "No drivers available at the moment." });
    }

    // compute driver distances from pickup
    const driversWithDistance = drivers
      .filter(d => d.location?.lat && d.location?.lng)
      .map(d => ({
        driver: d,
        distance: calculateDistance(pickupLocation, d.location),
      }))
      .sort((a, b) => a.distance - b.distance);

    // calculate trip distance and price
    const tripDistance = calculateDistance(pickupLocation, destinationLocation);
    console.log("Trip distance:", tripDistance);

    if (isNaN(tripDistance) || tripDistance <= 0) {
      return res.status(400).json({ msg: "Invalid trip distance calculated." });
    }

    const price = +(tripDistance * RATE_PER_KM).toFixed(2);

    console.log("Calculated price:", price);

    for (const { driver } of driversWithDistance) {
      // create booking with price
      const booking = await Booking.create({
        user: userId,
        pickupLocation,
        destinationLocation,
        driver: driver._id,
        profileImage: driver.profileImage,
        price // use calculated price here
      });

      // notify driver via socket
      if (driver.socketId && global.io) {
        global.io.to(driver.socketId).emit("BookingRequest", {
          bookingId: booking._id,
          pickupLocation,
          destinationLocation,
          estimatedPrice:price,
          driverId: driver._id,
        });
      }

      // wait 30s for acceptance
      const isAccepted = await new Promise(resolve => {
        setTimeout(async () => {
          try {
            const updated = await Booking.findById(booking._id);
            resolve(updated?.status === 'Accepted');
          } catch {
            resolve(false);
          }
        }, 30 * 1000);
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
        break;
      } else {
        // remove pending booking if not accepted
        await Booking.findByIdAndDelete(booking._id);
      }
    }

    if (!responseSent) {
      return res.status(404).json({ msg: "No drivers responded to the booking request." });
    }

  } catch (error) {
    console.error("Booking error:", error);
    if (!responseSent) {
      return res.status(500).json({ msg: "Error creating booking", error: error.message });
    }
  }
};
const getallUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const bookings = await Booking.find({ user: userObjectId, status: 'Accepted' });

    if (!bookings.length) {
      return res.status(400).json({ msg: 'No booking requests accepted at the moment' });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'An error occurred while retrieving bookings' });
  }
};

const getallDriverBookings = async (req, res) => {
  try {
    const { driverId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ msg: 'Invalid driver ID format' });
    }
    const driverObjectId = new mongoose.Types.ObjectId(driverId);
    const bookings = await Booking.find({ driver: driverObjectId, status: 'Accepted' });

    if (!bookings.length) {
      return res.status(400).json({ msg: 'No booking requests accepted at the moment' });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'An error occurred while retrieving bookings' });
  }
};

const Review = async (req, res) => {
  try {
    const { bookingId, review, rating } = req.body;
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const driver = await Driver.findById(booking.driver);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    booking.review = review;
    booking.rating = rating;

    const totalRatings = driver.numRatings * driver.avgRating + rating;
    const newNumRatings = driver.numRatings + 1;
    driver.numRatings = newNumRatings;
    driver.avgRating = totalRatings / newNumRatings;

    await booking.save();
    await driver.save();

    return res.status(200).json({ message: 'Review submitted successfully', booking });
  } catch (error) {
    console.error('Error submitting review:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

const getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log(bookingId)
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    console.log('maxafdsfds');

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'No booking found with this ID' });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

const GetCompletedBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ user: userId, status: 'Completed' });
    if (!bookings.length) {
      return res.status(400).json({ message: 'No completed booking exists with such userId' });
    }
    return res.status(200).json({ message: 'Here are your completed bookings', bookings });
  } catch (error) {
    console.error('Error fetching completed bookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const CompleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format" });
    }

    const booking = await Booking.findById(bookingId).populate("user");
    if (!booking) {
      return res.status(404).json({ message: "No booking with such ID exists" });
    }
    if (booking.status === "Completed") {
      return res.status(400).json({ message: "This booking has already been completed" });
    }

    booking.status = "Completed";
    await booking.save();

    if (booking.user.socketId && global.io) {
      global.io.to(booking.user.socketId).emit("RideCompletednowpay", {
        bookingId: booking._id,
        price: booking.price,
        paymentPageUrl: `/payment/${booking._id}`,
      });
    }

    return res.status(200).json({
      message: "Ride ended successfully",
      booking: {
        id: booking._id,
        status: booking.status,
        pickupLocation: booking.pickupLocation,
        destinationLocation: booking.destinationLocation,
        price: booking.price,
        driver: booking.driver,
        user: booking.user,
      },
    });
  } catch (error) {
    console.error("Error completing booking:", error);
    return res.status(500).json({ error: "Server error, please try again later" });
  }
};

const CancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'No booking found with this ID' });
    }
    if (booking.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    return res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = {
  DoBooking,
  getallDriverBookings,
  getallUserBookings,
  Review,
  getBooking,
  GetCompletedBookings,
  CompleteBooking,
  CancelBooking
};
