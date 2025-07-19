const Donations = require("../models/donationmodel");
const DonationPaymentStatus = require("../models/donationPaymentStatusModel");

const getPaidMonthsForMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({ error: "Member ID is required" });
    }

    // From Donations model
    const paidMonthlyDonations = await Donations.find({
      donationmember_id: memberId,
      donation_type: "monthly",
      status: "paid",
    });

    const paidMonthsFromDonations = paidMonthlyDonations
      .map((donation) => donation.months)
      .flat();

    // From DonationPaymentStatus model
    const paidStatuses = await DonationPaymentStatus.find({
      donationmember_id: memberId,
      status: "paid",
    });

    const paidMonthsFromStatus = paidStatuses.map((entry) => entry.month);

    // Merge both sources and remove duplicates
    const combinedMonths = [
      ...new Set([...paidMonthsFromDonations, ...paidMonthsFromStatus]),
    ].sort();

    return res.status(200).json({ memberId, paidMonths: combinedMonths });
  } catch (error) {
    console.error("Error fetching paid months:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getPaidMonthsForMember,
};
