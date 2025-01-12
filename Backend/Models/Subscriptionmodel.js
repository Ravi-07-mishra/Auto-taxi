const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Driver",
  },
  braintree_subscription_id: {
    type: String,
    required: true,
  },
  plan_id: {
    type: String,
    required: true,
  },
  subscription_start_date: {
    type: Date,
    required: true,
  },
  subscription_end_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "expired", "canceled"],
    default: "active",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update `updated_at` before saving
subscriptionSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
