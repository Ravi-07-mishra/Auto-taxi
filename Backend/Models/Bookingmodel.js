const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  driver:    { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickupLocation:      { type: { lat: Number, lng: Number }, required: true },
  destinationLocation: { type: { lat: Number, lng: Number }, required: true },
  status:    { type: String, enum: ['Pending','Accepted','Declined','Completed','Canceled'], default: 'Pending' },
  price:     { type: Number },
  createdAt: { type: Date, default: Date.now },

  // Rating system
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },

  // ——— Ride‑start OTP fields ———
  rideOtp:       { type: String, default: null },
  rideOtpExpiry: { type: Date,   default: null },
});

module.exports = mongoose.model('Booking', BookingSchema);
