const express = require("express");
const {
  addDonation,
  getAllDonations,
  getDonation,
  updateDonation,
  deleteDonation,
  updateDonationPaymentStatus,
  getDonationStatus,
} = require("../controllers/donationcontroller");
const {
  getPaidMonthsForMember,
} = require("../controllers/paidmonthcontroller");

const router = express.Router();

router.route("/donation").post(addDonation);
router.route("/donations").get(getAllDonations);
router.route("/donation/:id").get(getDonation);
router.route("/donation/:id").put(updateDonation);
router.route("/donation/:id").delete(deleteDonation);
router.route("/donation-status/:memberId").get(getDonationStatus);
router.route("/paid-months/:memberId").get(getPaidMonthsForMember);
router.route("/donation-status/:memberId").put(updateDonationPaymentStatus);

module.exports = router;
