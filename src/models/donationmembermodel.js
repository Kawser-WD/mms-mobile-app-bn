const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const donationmemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    user_type: {
      type: String,
      enum: ["donatemember", "admin"],
      default: "donatemember",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    reset_code: String,
    reset_expires: Date,
  },
  { timestamps: true }
);

donationmemberSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

donationmemberSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const DonationMembers = mongoose.model("DonationMember", donationmemberSchema);

module.exports = DonationMembers;
