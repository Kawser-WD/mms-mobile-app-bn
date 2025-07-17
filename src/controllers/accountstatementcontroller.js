const DonationPaymentStatus = require("../models/donationPaymentStatusModel");
const Donations = require("../models/donationmodel"); // add this import
const Expenses = require("../models/expensemodel");

const getAccountStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const otherDonations = await Donations.find({}).limit(10);
    console.log(otherDonations);

    // 1. Paid donation payment statuses in date range
    const paidStatuses = await DonationPaymentStatus.find({
      status: "paid",
      createdAt: { $gte: start, $lte: end },
    }).populate("donationmember_id");

    // 2. Paid donations (including jomma, eid-jamat, etc.)
    const paidDonations = await Donations.find({
      status: "paid",
      createdAt: { $gte: start, $lte: end },
      donation_type: {
        $in: ["monthly", "jomma", "eid-jamat", "daily", "development"],
      }, // add all types you want to include
    });

    // 3. Expenses in date range
    const expenseList = await Expenses.find({
      expense_date: { $gte: start, $lte: end },
    });

    // Calculate total_earn from both payment statuses and donations
    const totalFromStatuses = paidStatuses.reduce((acc, curr) => {
      const amount = curr.donationmember_id?.amount || 0;
      return acc + amount;
    }, 0);

    const totalFromDonations = paidDonations.reduce((acc, curr) => {
      // assuming donation documents have 'amount' field directly
      return acc + (curr.amount || 0);
    }, 0);

    const total_earn = totalFromStatuses + totalFromDonations;

    const total_expense = expenseList.reduce(
      (acc, curr) => acc + curr.expense_amount,
      0
    );

    const profit_or_loss = total_earn - total_expense;

    res.status(200).json({
      donationList: [...paidStatuses, ...paidDonations], // optionally merge for frontend
      expenseList,
      total_earn,
      total_expense,
      profit_or_loss,
      status: profit_or_loss >= 0 ? "Profit" : "Loss",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAccountStatement,
};
