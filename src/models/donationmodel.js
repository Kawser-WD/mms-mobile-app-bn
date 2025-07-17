const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donationmember_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DonationMember", // Correct reference
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    months: {
      type: [String],
    },
    donation_type: {
      type: String,
      enum: ["monthly", "jomma", "eid-jamat", "daily", "development"],
      required: true,
    },
    donation_details: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "paid", // or "pending" based on your logic
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Prevent OverwriteModelError
const Donations =
  mongoose.models.donation || mongoose.model("donation", donationSchema);

module.exports = Donations;
