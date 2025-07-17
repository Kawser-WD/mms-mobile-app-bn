const express = require("express");
const {
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/auth");
const { protect } = require("../middleware/authmiddleware");
const router = express.Router();

router.route("/login").post(login);

// // Change password route (protected)
router.post("/change-password", protect, changePassword);

// router.post("/forgot-password", requestPasswordReset);
// router.post("/reset-password", resetPassword);

module.exports = router;
