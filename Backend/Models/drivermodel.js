const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  aadhaar_number: {
    type: String,
    required: true,
    unique: true,
  },
  driving_license_number: {
    type: String,
    required: true,
    unique: true,
  },
  vehicle_license_number: {
    type: String,
    required: true,
    unique: true,
  },
  date_of_birth: {
    type: Date,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  licenseDocPath: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  location: {
    lat: {
      type: Number,
      required: false,
    },
    lng: {
      type: Number,
      required: false,
    },
  },
  socketId: { type: String, default: null },
  numRatings: { // Field to store the number of ratings
    type: Number,
    default: 0,
  },
  avgRating: { // Field to store the average rating
    type: Number,
    default: 0,
  },
  profileImage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
