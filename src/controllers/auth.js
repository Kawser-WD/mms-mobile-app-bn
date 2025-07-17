const DonationMember = require("../models/donationmembermodel");
const generateToken = require("../utils/generateToken");

// const login = async (req, res) => {
//   try {
//     const { phone, password } = req.body;
//     const user = await DonationMember.findOne({ phone });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const isMatch = await user.matchPassword(password);
//     console.log("mathch", isMatch);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid phone or password" });
//     }

//     res.json({
//       message: "Login success",
//       _id: user._id,
//       token: generateToken(user._id),
//       userType: user.user_type,
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// change password

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("Attempting login for phone:", phone);
    console.log("Provided password (plain):", password); // IMPORTANT: DO NOT LOG THIS IN PRODUCTION ENVIRONMENTS

    const user = await DonationMember.findOne({ phone });

    if (!user) {
      console.log("User not found for phone:", phone);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user.name);
    console.log("Stored hashed password:", user.password); // This is the hashed one from DB

    const isMatch = await user.matchPassword(password);
    console.log("Password match result (isMatch):", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid phone or password" });
    }

    res.json({
      message: "Login success",
      _id: user._id,
      token: generateToken(user._id), // Make sure generateToken is defined and working
      userType: user.user_type,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// const changePassword = async (req, res) => {
//   try {
//     const userId = req.user._id; // req.user set by auth middleware
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const user = await DonationMember.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const isMatch = await user.matchPassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Current password is incorrect" });
//     }

//     user.password = newPassword; // this will be hashed by pre('save')
//     await user.save();

//     res.json({ message: "Password updated successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    console.log("Change Password Request for User ID:", userId);
    console.log("Received currentPassword (plain):", currentPassword); // BE CAREFUL LOGGING PASSWORDS IN PROD
    console.log("Received newPassword (plain):", newPassword); // BE CAREFUL LOGGING PASSWORDS IN PROD

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await DonationMember.findById(userId);
    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user.name);
    console.log("Stored hashed password for user:", user.password);

    const isMatch = await user.matchPassword(currentPassword);
    console.log("Match result for currentPassword:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword; // this will be hashed by pre('save')
    await user.save();
    console.log("Password updated successfully for user:", user.name);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in changePassword:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login, changePassword };

// const DonationMember = require("../models/donationmembermodel");
// const generateToken = require("../utils/generateToken");
// const { sendSMS } = require("../utils/twilio");

// // Your Twilio SMS utility

// // Login controller (existing)
// const login = async (req, res) => {
//   try {
//     const { phone, password } = req.body;
//     console.log("login controller:", phone, password);
//     const user = await DonationMember.findOne({ phone });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     if (user && (await user.matchPassword(password))) {
//       res.json({
//         message: "login success",
//         _id: user._id,
//         token: generateToken(user._id),
//         userType: user.user_type,
//       });
//     } else {
//       res.status(401).send(new Error("invalid user name or password"));
//     }
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Change password controller (existing)
// const changePassword = async (req, res) => {
//   try {
//     const userId = req.user._id; // req.user set by auth middleware
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const user = await DonationMember.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const isMatch = await user.matchPassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Current password is incorrect" });
//     }

//     user.password = newPassword; // this will be hashed by pre('save')
//     await user.save();

//     res.json({ message: "Password updated successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Forgot password - send OTP via SMS
// const requestPasswordReset = async (req, res) => {
//   try {
//     const { phone } = req.body;

//     if (!phone) return res.status(400).json({ error: "Phone is required" });

//     const user = await DonationMember.findOne({ phone });
//     if (!user) return res.status(404).json({ error: "User not found" });

//     // Generate 6-digit OTP
//     const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
//     const expires = Date.now() + 10 * 60 * 1000; // expires in 10 minutes

//     user.reset_code = resetCode;
//     user.reset_expires = new Date(expires);
//     await user.save();

//     const message = `Your password reset code is: ${resetCode}`;
//     console.log("sendSMS is:", typeof sendSMS); // should print "function"

//     await sendSMS(phone, message);

//     res.json({ message: "Reset code sent to your phone" });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // Reset password - verify OTP and update password
// const resetPassword = async (req, res) => {
//   try {
//     const { phone, code, newPassword } = req.body;

//     if (!phone || !code || !newPassword) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const user = await DonationMember.findOne({ phone });

//     if (
//       !user ||
//       user.reset_code !== code ||
//       !user.reset_expires ||
//       user.reset_expires < Date.now()
//     ) {
//       return res.status(400).json({ error: "Invalid or expired reset code" });
//     }

//     user.password = newPassword; // hashed by pre('save')
//     user.reset_code = null;
//     user.reset_expires = null;

//     await user.save();

//     res.json({ message: "Password has been reset successfully" });
//   } catch (error) {
//     console.error("Reset password error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// module.exports = {
//   login,
//   changePassword,
//   requestPasswordReset,
//   resetPassword,
// };
