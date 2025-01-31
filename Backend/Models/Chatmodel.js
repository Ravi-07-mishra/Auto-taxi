const mongoose = require("mongoose")

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, refPath: "senderModel", required: true },
  senderModel: { type: String, enum: ["User", "Driver"], required: true },
  senderName: { type: String, required: true }, // Add this line
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

const ChatSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  messages: [MessageSchema], // Store all messages related to this booking
})

module.exports = mongoose.model("Chat", ChatSchema)

