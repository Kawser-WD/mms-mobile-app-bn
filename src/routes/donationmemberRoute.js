const express = require("express");
const {
  createDonationMember,
  getAllDonationMembers,
  getDonationMember,
  updateDonationMember,
  deleteDonationMember,
} = require("../controllers/donationmembercontroller");

const router = express.Router();

router.route("/donatemember").post(createDonationMember);
router.route("/donatemembers").get(getAllDonationMembers);
router.route("/donatemember/:id").get(getDonationMember);
router.route("/donatemember/:id").put(updateDonationMember);
router.route("/donatemember/:id").delete(deleteDonationMember);

module.exports = router;
