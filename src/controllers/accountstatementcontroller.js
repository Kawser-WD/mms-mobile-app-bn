// const DonationPaymentStatus = require("../models/donationPaymentStatusModel");
// const Donations = require("../models/donationmodel"); // add this import
// const Expenses = require("../models/expensemodel");

// const getAccountStatement = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     if (!startDate || !endDate) {
//       return res.status(400).json({ error: "Start and end date are required" });
//     }

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     end.setHours(23, 59, 59, 999);

//     const otherDonations = await Donations.find({}).limit(10);
//     console.log(otherDonations);

//     // 1. Paid donation payment statuses in date range
//     const paidStatuses = await DonationPaymentStatus.find({
//       status: "paid",
//       createdAt: { $gte: start, $lte: end },
//     }).populate("donationmember_id");

//     // 2. Paid donations (including jomma, eid-jamat, etc.)
//     const paidDonations = await Donations.find({
//       status: "paid",
//       createdAt: { $gte: start, $lte: end },
//       donation_type: {
//         $in: ["monthly", "jomma", "eid-jamat", "daily", "development"],
//       }, // add all types you want to include
//     });

//     // 3. Expenses in date range
//     const expenseList = await Expenses.find({
//       expense_date: { $gte: start, $lte: end },
//     });

//     // Calculate total_earn from both payment statuses and donations
//     const totalFromStatuses = paidStatuses.reduce((acc, curr) => {
//       const amount = curr.donationmember_id?.amount || 0;
//       return acc + amount;
//     }, 0);

//     const totalFromDonations = paidDonations.reduce((acc, curr) => {
//       // assuming donation documents have 'amount' field directly
//       return acc + (curr.amount || 0);
//     }, 0);

//     const total_earn = totalFromStatuses + totalFromDonations;

//     const total_expense = expenseList.reduce(
//       (acc, curr) => acc + curr.expense_amount,
//       0
//     );

//     const profit_or_loss = total_earn - total_expense;

//     res.status(200).json({
//       donationList: [...paidStatuses, ...paidDonations], // optionally merge for frontend
//       expenseList,
//       total_earn,
//       total_expense,
//       profit_or_loss,
//       status: profit_or_loss >= 0 ? "Profit" : "Loss",
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = {
//   getAccountStatement,
// };

const DonationPaymentStatus = require("../models/donationPaymentStatusModel");
const Donations = require("../models/donationmodel");
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

    // ✅ 1. Get monthly donations from DonationPaymentStatus
    const monthlyPayments = await DonationPaymentStatus.find({
      status: "paid",
      createdAt: { $gte: start, $lte: end },
    }).populate("donationmember_id");

    // ✅ 2. Get all donation records (includes monthly and others)
    const allDonations = await Donations.find({
      status: "paid",
      createdAt: { $gte: start, $lte: end },
    });

    // ✅ 3. Get IDs of all monthly-linked donations
    const monthlyDonationKeys = new Set(
      monthlyPayments.map((dp) => {
        const key = `${dp.donationmember_id?._id}_${dp.month}`;
        return key;
      })
    );

    // ✅ 4. Filter Donations to only include non-monthly
    const oneTimeDonations = allDonations.filter((donation) => {
      // Skip monthly types
      if (donation.donation_type === "monthly") return false;

      // Safety: Also skip if somehow this donation exists in monthlyPayments
      const monthList = donation.months || []; // monthly donations have months array
      return !monthList.some((m) => {
        const key = `${donation.donationmember_id}_${m}`;
        return monthlyDonationKeys.has(key);
      });
    });

    // ✅ 5. Fetch Expenses
    const expenseList = await Expenses.find({
      expense_date: { $gte: start, $lte: end },
    });

    // ✅ 6. Totals
    const totalMonthly = monthlyPayments.reduce(
      (sum, dp) => sum + (dp.amount || 0),
      0
    );
    const totalOneTime = oneTimeDonations.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );
    const totalExpense = expenseList.reduce(
      (sum, e) => sum + (e.expense_amount || 0),
      0
    );
    const totalEarn = totalMonthly + totalOneTime;
    const profitOrLoss = totalEarn - totalExpense;

    res.status(200).json({
      donationList: [...monthlyPayments, ...oneTimeDonations],
      expenseList,
      total_earn: totalEarn,
      total_expense: totalExpense,
      profit_or_loss: profitOrLoss,
      status: profitOrLoss >= 0 ? "Profit" : "Loss",
    });
  } catch (error) {
    console.error("getAccountStatement error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAccountStatement };
