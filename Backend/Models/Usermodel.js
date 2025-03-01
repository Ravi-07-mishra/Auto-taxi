const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
    },
    // phone: {
    //     type: String,
    //     required: true,
    //     unique: true,
    //     minlength: [10, 'Phone number should be at least 10 digits'],
    //     maxlength: [10, 'Phone number should be at most 10 digits'],
    // },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true
    },
    socketId: { type: String, default: null },
    profileImage: { type: String, default: '' },
   
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
