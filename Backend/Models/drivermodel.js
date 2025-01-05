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
    // New location field to store latitude and longitude
    location: {
        lat: {
            type: Number,
            required: false,  // Not required initially
        },
        lng: {
            type: Number,
            required: false,  // Not required initially
        },
       
    },
    socketId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
