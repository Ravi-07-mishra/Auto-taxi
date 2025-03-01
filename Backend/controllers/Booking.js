const Booking = require("../Models/Bookingmodel");
const Driver = require("../Models/drivermodel");
const { calculateDistance } = require("../utiils/Calculatedistance");

const DoBooking = async (req, res) => {
  let responseSent = false;

  try {
    const { userId, pickupLocation, destinationLocation } = req.body;

    const validateLocation = (location) =>
      location && typeof location.lat === "number" && typeof location.lng === "number";

    if (!userId || !validateLocation(pickupLocation) || !validateLocation(destinationLocation)) {
      return res.status(400).json({ msg: "All fields are required and must be valid." });
    }

    const drivers = await Driver.find({ isAvailable: true });
    if (drivers.length === 0) {
      return res.status(404).json({ msg: "No drivers available at the moment." });
    }
    console.log(drivers);

    const driversWithDistance = drivers
      .filter((driver) => driver.location?.lat && driver.location?.lng)
      .map((driver) => ({
        driver,
        distance: calculateDistance(pickupLocation, driver.location),
      }));
    console.log('driversWithDistance:', driversWithDistance);

    driversWithDistance.sort((a, b) => a.distance - b.distance);

    for (const { driver } of driversWithDistance) {
      console.log(`Trying to book driver: ${driver.name} (${driver.socketId})`);

      // Create booking with 'Pending' status
      const booking = await Booking.create({
        user: userId,
        pickupLocation,
        destinationLocation,
        driver: driver._id,
      });

      console.log(`Booking created: ${booking._id}`);

      // Emit booking request to driver
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

      // Wait for 30 seconds to allow driver to respond
      const isAccepted = await new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const updatedBooking = await Booking.findById(booking._id);
            if (updatedBooking) {
              resolve(updatedBooking.status === 'Accepted');
            } else {
              resolve(false);
            }
          } catch (error) {
            console.error("Error checking booking status:", error);
            resolve(false);
          }
        }, 30 * 1000); // 30 seconds timeout
      });

      // Check if the booking was accepted
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
        console.log(`Driver ${driver.name} did not respond. Trying next driver...`);
        await Booking.findByIdAndDelete(booking._id); // Only delete if not accepted
      }
    }

    if (!responseSent) {
      responseSent = true;
      return res.status(404).json({ msg: "No drivers responded to the booking request." });
    }
  } catch (error) {
    console.error("Booking error:", error);
    if (!responseSent) {
      return res.status(500).json({ msg: "Error creating booking", error: error.message });
    }
  }
};


const mongoose = require('mongoose');

const getallUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('User ID from request:', userId);  // Log the userId
   
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('Converted ObjectId:', userObjectId);  
    
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

const getallDriverBookings = async (req, res) => {
  try {
    const { driverId } = req.params;
    console.log('Driver ID from request:', driverId);

    // Validate if the driverId is a valid ObjectId (24 characters hex string)
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        msg: 'Invalid driver ID format',
      });
    }

    const driverObjectId = new mongoose.Types.ObjectId(driverId);
    console.log('Converted ObjectId:', driverObjectId);

    // Proceed with finding the bookings
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
};
const Review = async (req, res) => {
  try {
    const { bookingId, review, rating } = req.body;

    // Validate the rating value (ensure it's between 1 and 5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Find the driver by ID (using booking driver reference)
    const driver = await Driver.findById(booking.driver);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update the booking with the new review and rating
    booking.review = review;
    booking.rating = rating;

    // Update driver's ratings: Calculate new average and update number of ratings
    const totalRatings = driver.numRatings * driver.avgRating + rating;
    const newNumRatings = driver.numRatings + 1;
    const newAvgRating = totalRatings / newNumRatings;

    driver.numRatings = newNumRatings;
    driver.avgRating = newAvgRating;

    // Save the updated booking and driver
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

    // Validate bookingId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: 'Invalid booking ID format',
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: 'No booking found with this ID',
      });
    }
    console.log(booking);

    return res.status(200).json({
      booking,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
const GetCompletedBookings = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await Booking.find({ user: userId, status: 'Completed' })
    if(!bookings){
      return res.status(400).json({
        message: 'No completed booking exists with such userId'
      })
    }


   return res.status(200).json({
    message: 'Here are you completed Bookings',
    bookings
   })
  } catch (error) {
    console.error('Error fetching completed bookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
const CompleteBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Validate bookingId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID format",
      });
    }

    const booking = await Booking.findById(bookingId).populate("user");

    if (!booking) {
      return res.status(404).json({
        message: "No booking with such ID exists",
      });
    }

    if (booking.status === "Completed") {
      return res.status(400).json({
        message: "This booking has already been completed",
      });
    }

    // Update the booking status to 'Completed'
    booking.status = "Completed";
    await booking.save();

    // Emit RideCompletednowpay event to the user
    if (booking.user.socketId && global.io) {
      global.io.to(booking.user.socketId).emit("RideCompletednowpay", {
        bookingId: booking._id,
        price: booking.price, // Use the price from the booking
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
    return res.status(500).json({
      error: "Server error, please try again later",
    });
  }
};

const CancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Validate bookingId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: 'Invalid booking ID format',
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: 'No booking found with this ID',
      });
    }

    // Check if the booking is already completed
    if (booking.status === 'Completed') {
      return res.status(400).json({
        message: 'Cannot cancel a completed booking',
      });
    }

    // Update the booking status to 'Cancelled'
    booking.status = 'Cancelled';
    await booking.save();

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      message: 'Server error. Please try again later.',
    });
  }
};

module.exports = { DoBooking, getallDriverBookings, getallUserBookings, Review, getBooking, GetCompletedBookings, CompleteBooking, CancelBooking };


