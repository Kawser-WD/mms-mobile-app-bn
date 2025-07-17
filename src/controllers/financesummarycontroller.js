const Donations = require("../models/donationmodel");
const DonationPaymentStatus = require("../models/donationPaymentStatusModel");
const Expenses = require("../models/expensemodel");
const DonationMember = require("../models/donationmembermodel"); // assuming you have this model

const getFinancialReport = async (req, res) => {
  try {
    // 🔹 Total Donations (Donations + PaymentStatus)
    const donationSum = await Donations.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const donationAmount = donationSum[0]?.total || 0;

    const paymentStatusSum = await DonationPaymentStatus.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const paymentStatusAmount = paymentStatusSum[0]?.total || 0;

    const totalDonation = donationAmount + paymentStatusAmount;

    // 🔹 Total Expenses
    const expenseSum = await Expenses.aggregate([
      { $group: { _id: null, total: { $sum: "$expense_amount" } } },
    ]);
    const totalExpense = expenseSum[0]?.total || 0;

    const latestBalance = totalDonation - totalExpense;

    // 🔹 Most Recent Earning (Donations or PaymentStatus)
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

    // 🔹 Most Recent Expense
    const lastExpense = await Expenses.findOne({})
      .sort({ expense_date: -1, createdAt: -1 })
      .select("expense_amount expense_details expense_date")
      .lean();

    // 🔹 Total Donors
    const totalDonor = await DonationMember.countDocuments();

    // 🔹 Total Active Donors (Donations or PaymentStatus with status: paid)
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
