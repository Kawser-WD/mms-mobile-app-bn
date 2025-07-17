const mongoose = require("mongoose");

const donationPaymentStatusSchema = new mongoose.Schema(
  {
    donationmember_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DonationMember", // <-- CHANGED: Corrected to "DonationMember" to match the registered model name
      required: true,
    },
    month: {
      type: String, // Example: "2025-7" (as per your data and updated controllers)
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const DonationPaymentStatus =
  mongoose.models.donationpaymentstatus ||
  mongoose.model("donationpaymentstatus", donationPaymentStatusSchema);

module.exports = DonationPaymentStatus;
