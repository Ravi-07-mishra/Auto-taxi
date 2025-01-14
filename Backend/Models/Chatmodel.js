const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel', required: true },
    senderModel: { type: String, enum: ['User', 'Driver'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // List of users who have seen the message
});

module.exports = mongoose.model('Chat', ChatSchema);
