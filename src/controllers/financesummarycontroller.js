const Donations = require("../models/donationmodel");
const DonationPaymentStatus = require("../models/donationPaymentStatusModel");
const Expenses = require("../models/expensemodel");
const DonationMember = require("../models/donationmembermodel"); // assuming you have this model

const getFinancialReport = async (req, res) => {
  try {
    // 🔹 Total Monthly Donations (Source of Truth: DonationPaymentStatus)
    const totalMonthlyDonationSum = await DonationPaymentStatus.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalMonthlyDonationAmount = totalMonthlyDonationSum[0]?.total || 0;

    // 🔹 Total Non-Monthly Donations (Source of Truth: Donations model, but exclude 'monthly' type)
    const totalNonMonthlyDonationSum = await Donations.aggregate([
      { $match: { status: "paid", donation_type: { $ne: "monthly" } } }, // Exclude 'monthly' type
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalNonMonthlyDonationAmount =
      totalNonMonthlyDonationSum[0]?.total || 0;

    const totalDonation =
      totalMonthlyDonationAmount + totalNonMonthlyDonationAmount;

    // 🔹 Total Expenses
    const expenseSum = await Expenses.aggregate([
      { $group: { _id: null, total: { $sum: "$expense_amount" } } },
    ]);
    const totalExpense = expenseSum[0]?.total || 0;

    const latestBalance = totalDonation - totalExpense;

    // 🔹 Most Recent Earning (Now considering both sources, but for display)
    let lastEarning = null;

    const recentDonation = await Donations.findOne({ status: "paid" })
      .sort({ createdAt: -1 })
      .select("amount createdAt donation_type name")
      .lean();

    const recentMonthlyPayment = await DonationPaymentStatus.findOne({
      status: "paid",
    })
      .sort({ createdAt: -1 })
      .select("amount createdAt month")
      .lean();

    if (recentDonation && recentMonthlyPayment) {
      lastEarning =
        recentDonation.createdAt > recentMonthlyPayment.createdAt
          ? recentDonation
          : recentMonthlyPayment;
    } else if (recentDonation) {
      lastEarning = recentDonation;
    } else if (recentMonthlyPayment) {
      lastEarning = recentMonthlyPayment;
    }

    // 🔹 Most Recent Expense (No change)
    const lastExpense = await Expenses.findOne({})
      .sort({ expense_date: -1, createdAt: -1 })
      .select("expense_amount expense_details expense_date")
      .lean();

    // 🔹 Total Donors (No change)
    const totalDonor = await DonationMember.countDocuments();

    // 🔹 Total Active Donors (No change - still good to combine distinct from both)
    const activeDonorsFromDonations = await Donations.distinct(
      "donationmember_id",
      { status: "paid" }
    );
    const activeDonorsFromPayments = await DonationPaymentStatus.distinct(
      "donationmember_id",
      { status: "paid" }
    );

    const activeDonorSet = new Set([
      ...activeDonorsFromDonations
        .filter((id) => id)
        .map((id) => id.toString()),
      ...activeDonorsFromPayments.filter((id) => id).map((id) => id.toString()),
    ]);

    const totalActiveDonor = activeDonorSet.size;

    return res.status(200).json({
      summary: {
        latestBalance,
        totalDonation, // Added totalDonation to the response for clarity
        totalExpense, // Added totalExpense to the response for clarity
        lastEarning,
        lastExpense,
        totalDonor,
        totalActiveDonor,
      },
    });
  } catch (error) {
    console.error("Financial report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getFinancialReport };
